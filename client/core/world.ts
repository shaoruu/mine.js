import { EventEmitter } from 'events';

import { AABB, Clouds, ServerChunkType, Sky } from '../libs';
import { Coords3, Coords2 } from '../libs/types';
import { Helper } from '../utils';

import { Chunk } from './chunk';
import { Engine } from './engine';

type WorldOptionsType = {
  name?: string;
  maxHeight?: number;
  chunkSize?: number;
  subChunks?: number;
  dimension?: number;
  renderRadius: number;
  requestRadius: number;
  maxChunkProcessPerFrame: number;
  maxBlockPerFrame: number;
  chunkAnimation: boolean;
  animationTime: number;
};

class World extends EventEmitter {
  public name: string;
  // has all chunks been generated within render radius at start
  public isReady = false;

  public sky: Sky;
  public clouds: Clouds;

  // uniforms
  public uSunlightIntensity = { value: 0.1 };

  public blockData: { passables: number[] } = {
    passables: [],
  };

  private camChunkName: string;
  private camChunkPos: Coords2;

  private pendingChunks: Coords2[] = [];
  private requestedChunks: Set<string> = new Set();
  private receivedChunks: ServerChunkType[] = [];
  private chunks: Map<string, Chunk> = new Map();

  constructor(public engine: Engine, public options: WorldOptionsType) {
    super();

    this.sky = new Sky(engine.rendering);
    this.clouds = new Clouds(engine.rendering);

    // kinda ugly
    this.name = options.name;

    engine.on('start', () => {
      this.updateRenderRadius(this.options.renderRadius);

      engine.inputs.bind('esc', engine.lock, 'menu', { occasion: 'keyup' });
    });

    engine.on('focus', async () => {
      if (this.engine.tickSpeed === 0) return;
      const [time, processed] = JSON.parse(await engine.network.fetchData('/time'));
      const received = Date.now();
      this.setTime(time + (received - processed) / this.engine.tickSpeed, false);
    });
  }

  setup = (worldData: any) => {
    const { chunk_size, dimension, max_height, sub_chunks } = worldData;

    this.options.chunkSize = chunk_size;
    this.options.dimension = dimension;
    this.options.maxHeight = max_height;
    this.options.subChunks = sub_chunks;
  };

  tick = () => {
    this.checkCamChunk();
    this.requestChunks();
    this.meshChunks();
    this.animateSky();
  };

  getChunkByCPos = (cCoords: Coords2) => {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  };

  getChunkByName = (chunkName: string) => {
    return this.chunks.get(chunkName);
  };

  getChunkByVoxel = (vCoords: Coords3) => {
    const { chunkSize } = this.options;
    const chunkCoords = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    return this.getChunkByCPos(chunkCoords);
  };

  getNeighborChunksByVoxel = (vCoords: Coords3, padding = 0) => {
    const { chunkSize } = this.options;
    const chunk = this.getChunkByVoxel(vCoords);
    const [cx, cz] = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    const [lx, , lz] = Helper.mapVoxelPosToChunkLocalPos(vCoords, chunkSize);
    const neighborChunks: (Chunk | null)[] = [];

    // check if local position is on the edge
    // TODO: fix this hacky way of doing so.
    const a = lx < padding;
    const b = lz < padding;
    const c = lx >= chunkSize - padding;
    const d = lz >= chunkSize - padding;

    // direct neighbors
    if (a) neighborChunks.push(this.getChunkByCPos([cx - 1, cz]));
    if (b) neighborChunks.push(this.getChunkByCPos([cx, cz - 1]));
    if (c) neighborChunks.push(this.getChunkByCPos([cx + 1, cz]));
    if (d) neighborChunks.push(this.getChunkByCPos([cx, cz + 1]));

    // side-to-side diagonals
    if (a && b) neighborChunks.push(this.getChunkByCPos([cx - 1, cz - 1]));
    if (a && d) neighborChunks.push(this.getChunkByCPos([cx - 1, cz + 1]));
    if (b && c) neighborChunks.push(this.getChunkByCPos([cx + 1, cz - 1]));
    if (c && d) neighborChunks.push(this.getChunkByCPos([cx + 1, cz + 1]));

    return neighborChunks.filter(Boolean).filter((c) => c !== chunk);
  };

  getVoxelByVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getVoxel(...vCoords) : null;
  };

  getVoxelByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getVoxelByVoxel(vCoords);
  };

  getSolidityByVoxel = (vCoords: Coords3) => {
    const type = this.getVoxelByVoxel(vCoords);
    return vCoords[1] < this.options.maxHeight && type !== 0 && !this.blockData.passables.includes(type);
  };

  getFluidityByVoxel = (vCoords: Coords3) => {
    // TODO
    return false;
  };

  getSolidityByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getSolidityByVoxel(vCoords);
  };

  getFluidityByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getFluidityByVoxel(vCoords);
  };

  getRedLight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getRedLight(...vCoords) || 0;
  };

  getGreenLight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getGreenLight(...vCoords) || 0;
  };

  getBlueLight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getBlueLight(...vCoords) || 0;
  };

  getSunlight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getSunlight(...vCoords);
  };

  handleServerChunk = (serverChunk: ServerChunkType, prioritized = false) => {
    serverChunk.x = serverChunk.x || 0;
    serverChunk.z = serverChunk.z || 0;
    const { x: cx, z: cz } = serverChunk;
    const coords = [cx, cz] as Coords2;
    this.requestedChunks.delete(Helper.getChunkName(coords));
    if (prioritized) this.meshChunk(serverChunk);
    else this.receivedChunks.push(serverChunk);
  };

  setChunk = (chunk: Chunk) => {
    // TODO: remove chunks that are too far away
    return this.chunks.set(chunk.name, chunk);
  };

  setVoxel = (voxel: Coords3, type: number, sideEffects = true) => {
    const [vx, vy, vz] = voxel;

    if (sideEffects) {
      this.engine.network.server.sendEvent({
        type: 'UPDATE',
        updates: [{ vx, vy, vz, type }],
      });
    }
  };

  setManyVoxels = (voxels: { voxel: Coords3; type: number }[], sideEffects = true) => {
    if (voxels.length > this.options.maxBlockPerFrame) {
      // console.warn('Changing more voxels than recommended...');
      // TODO: maybe split the whole thing into chunks of updates?
    }

    if (sideEffects) {
      this.engine.network.server.sendEvent({
        type: 'UPDATE',
        updates: voxels.map(({ voxel: [vx, vy, vz], type }) => ({
          vx,
          vy,
          vz,
          type,
        })),
      });
    } else {
      this.engine.particles.addBreakParticles(
        voxels.map(({ voxel }) => ({ voxel, type: this.engine.world.getVoxelByVoxel(voxel) })),
        { count: voxels.length > 3 ? 1 : 6 },
      );
      voxels.forEach(({ voxel, type }) => {
        this.getChunkByVoxel(voxel)?.setVoxel(voxel[0], voxel[1], voxel[2], type);
      });
    }
  };

  breakVoxel = () => {
    const voxel = this.engine.player.lookBlock;
    if (voxel) {
      // TODO: use type.air instead of 0
      this.setVoxel(voxel, 0);
    }
  };

  placeVoxel = (type: number) => {
    const { dimension } = this.options;
    const { targetBlock, godMode } = this.engine.player;
    if (godMode) {
      if (targetBlock) this.setVoxel(targetBlock, type);
    } else {
      const {
        entity: {
          body: { aabb },
        },
      } = this.engine.player;

      const blockSize = dimension - 0.05;

      if (targetBlock) {
        const [tx, ty, tz] = targetBlock;
        const offset = (dimension - blockSize) / 2;
        const blockAABB = new AABB([tx + offset, ty + offset, tz + offset], [blockSize, blockSize, blockSize]);
        if (!aabb.intersects(blockAABB)) this.setVoxel(targetBlock, type);
      }
    }
  };

  updateRenderRadius = (renderRadiuus: number) => {
    const { registry } = this.engine;
    const { chunkSize, dimension } = this.options;

    registry.opaqueChunkMaterial.uniforms.uFogNear.value = renderRadiuus * 0.6 * chunkSize * dimension;
    registry.opaqueChunkMaterial.uniforms.uFogFar.value = renderRadiuus * chunkSize * dimension;

    this.checkCamChunk();
    this.surroundCamChunks();
  };

  setTime = (time: number, sideEffect = true) => {
    this.sky.tracker.time = time % 2400;

    // full cycle to sync up the colors
    if (this.engine.tickSpeed !== 0)
      for (let i = 0; i < 2400; i++) {
        this.sky.tick(1 / this.engine.tickSpeed, true);
      }

    if (sideEffect) {
      this.engine.network.server.sendEvent({
        type: 'CONFIG',
        json: {
          time: this.sky.tracker.time,
        },
      });
    }
  };

  setBlockData = ({ passables }) => {
    if (passables && passables.length) this.blockData.passables = passables;
  };

  sortPendingChunks = () => {
    const [cx, cz] = this.camChunkPos;

    this.pendingChunks.sort((a, b) => (cx - a[0]) ** 2 + (cz - a[1]) ** 2 - (cx - b[0]) ** 2 - (cz - b[1]) ** 2);
  };

  handleReconnection = () => {
    // move requested chunks to pending
    this.pendingChunks.push(...Array.from(this.requestedChunks).map((rc) => Helper.parseChunkName(rc) as Coords2));
    this.sortPendingChunks();
  };

  get camChunkPosStr() {
    return `${this.camChunkPos[0]} ${this.camChunkPos[1]}`;
  }

  get chunkMeshes() {
    const meshes = [];

    this.chunks.forEach((chunk) => {
      chunk.meshes.forEach((subMeshes) => {
        meshes.push(...subMeshes.filter((e) => !!e));
      });
    });

    return meshes;
  }

  private checkCamChunk = () => {
    const { chunkSize, renderRadius } = this.options;

    const pos = this.engine.player.voxel;
    const chunkPos = Helper.mapVoxelPosToChunkPos(pos, chunkSize);
    const chunkName = Helper.getChunkName(chunkPos);

    if (chunkName !== this.camChunkName) {
      this.engine.emit('chunk-changed', chunkPos);

      this.camChunkName = chunkName;
      this.camChunkPos = chunkPos;

      this.surroundCamChunks();
    }

    let supposed = 0;
    const [cx, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;

        // circle of chunks around camera effect
        if (dx * dx + dz * dz > renderRadius * renderRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (chunk) {
          chunk.addToScene();
        }

        supposed++;
      }
    }

    if (!this.isReady && supposed <= this.chunks.size) {
      this.isReady = true;
      this.engine.emit('world-ready');
    }
  };

  private surroundCamChunks = () => {
    const { renderRadius, requestRadius, chunkSize } = this.options;

    const [cx, cz] = this.camChunkPos;

    for (let x = cx - requestRadius; x <= cx + requestRadius; x++) {
      for (let z = cz - requestRadius; z <= cz + requestRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;
        if (dx * dx + dz * dz > requestRadius * requestRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (!chunk && !this.requestedChunks.has(Helper.getChunkName([x, z]))) {
          this.pendingChunks.push([x, z]);
        }
      }
    }

    this.pendingChunks = Array.from(new Set(this.pendingChunks.map((pc) => Helper.getChunkName(pc)))).map(
      (pcStr) => Helper.parseChunkName(pcStr) as Coords2,
    );

    // make pending chunks radiate from player, might have easier ways of doing so
    this.sortPendingChunks();

    // if the chunk is too far away, remove from scene.
    const deleteDistance = renderRadius * chunkSize * 1.414;
    const removeDistance = requestRadius * chunkSize * 1.414;
    for (const chunk of this.chunks.values()) {
      const dist = chunk.distTo(...this.engine.player.voxel);
      if (dist > deleteDistance) {
        chunk.removeFromScene();
      }

      if (dist > removeDistance) {
        chunk.dispose();
        this.chunks.delete(chunk.name);
      }
    }
  };

  private requestChunks = () => {
    // separate chunk request into frames to avoid clogging
    if (this.pendingChunks.length === 0 || !this.engine.connected) return;

    // don't clog up the server
    const framePendingChunks = this.pendingChunks.splice(0, 2);
    framePendingChunks.forEach(([cx, cz]) => {
      const rep = Helper.getChunkName([cx, cz]);
      if (this.requestedChunks.has(rep)) return;
      this.engine.network.server.sendEvent({
        type: 'REQUEST',
        json: { x: cx, z: cz },
      });
      this.requestedChunks.add(rep);
    });
  };

  private meshChunks = () => {
    // separate chunk meshing into frames to avoid clogging
    if (this.receivedChunks.length === 0) return;

    const { maxChunkProcessPerFrame } = this.options;

    const frameReceivedChunks = this.receivedChunks.splice(0, maxChunkProcessPerFrame);
    frameReceivedChunks.forEach(this.meshChunk);
  };

  private meshChunk = (serverChunk: ServerChunkType) => {
    const { x: cx, z: cz } = serverChunk;
    const coords = [cx, cz] as Coords2;

    let chunk = this.getChunkByCPos(coords);

    if (!chunk) {
      const { chunkSize, subChunks, dimension, maxHeight } = this.options;
      chunk = new Chunk(this.engine, coords, { size: chunkSize, subChunks, dimension, maxHeight });
      this.setChunk(chunk);
    }

    const { meshes, voxels, lights } = serverChunk;

    chunk.setupMesh(meshes);

    if (voxels.length) chunk.voxels.data = serverChunk.voxels;
    if (lights.length) chunk.lights.data = serverChunk.lights;
  };

  private animateSky = () => {
    const { delta } = this.engine.clock;
    this.sky.tick(delta);
    this.clouds.tick(delta);
  };
}

export { World, WorldOptionsType };
