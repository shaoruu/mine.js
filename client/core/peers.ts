import { Quaternion, Vector3 } from 'three';

import { Coords3 } from '../../shared/types';
import { Peer } from '../libs';

import { Engine } from '.';

type PacketType = {
  position: Coords3;
  rotation: [...Coords3, number];
};

type PeersOptionsType = {
  updateInterval: number; // ms
};

class Peers {
  public players: Map<string, Peer> = new Map();

  constructor(public engine: Engine, public options: PeersOptionsType) {
    const { updateInterval } = this.options;

    const {
      camera: { threeCamera },
    } = engine;

    let interval: NodeJS.Timeout;

    engine.on('init', () => {
      interval = setInterval(() => {
        const { position, quaternion } = threeCamera;

        const { x: px, y: py, z: pz } = position;
        const { x: qx, y: qy, z: qz, w: qw } = quaternion;

        engine.network.server.sendEvent({
          type: 'PEER',
          peers: [
            {
              id: engine.player.id,
              px,
              py,
              pz,
              qx,
              qy,
              qz,
              qw,
            },
          ],
        });
      }, updateInterval);
    });

    engine.on('disconnected', () => {
      clearInterval(interval);
    });
  }

  join(id: string) {
    const newPlayer = new Peer(id);
    Peer.material.map = this.engine.registry.atlasUniform.value;

    this.engine.rendering.scene.add(newPlayer.mesh);
    this.players.set(id, newPlayer);
  }

  update(id: string, packet: PacketType) {
    if (!this.players.has(id)) {
      // might have missed the player's join event
      this.join(id);
    }

    const player = this.players.get(id);

    const { position, rotation } = packet;
    player.update(new Vector3(...position), new Quaternion(...rotation));
  }

  leave(id: string) {
    const player = this.players.get(id);

    if (!player) return;

    this.engine.rendering.scene.remove(player.mesh);
    this.players.delete(id);
  }

  tick() {
    this.players.forEach((peer) => peer.tick());
  }
}

export { Peers, PeersOptionsType };
