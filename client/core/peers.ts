import { Quaternion, Vector3 } from 'three';

import { Peer } from '../libs';
import { Coords3 } from '../libs/types';
import { Helper } from '../utils';

import { Engine } from '.';

type PacketType = {
  name: string;
  position: Coords3;
  rotation: [...Coords3, number];
};

type PeersOptionsType = {
  updateInterval: number; // ms
};

class Peers {
  public wrapper: HTMLUListElement;

  public players: Map<string, Peer> = new Map();

  constructor(public engine: Engine, public options: PeersOptionsType) {
    const { updateInterval } = this.options;

    let interval: NodeJS.Timeout;

    engine.on('init', () => {
      const {
        player: { object },
      } = engine;

      const prevQuat = new Quaternion();

      interval = setInterval(() => {
        const { position, quaternion } = object;

        prevQuat.copy(quaternion);

        const { x: px, y: py, z: pz } = position;
        const { x: qx, y: qy, z: qz, w: qw } = quaternion;

        engine.network.server.sendEvent({
          type: 'PEER',
          peers: [
            {
              id: engine.player.id,
              name: engine.player.name,
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

    engine.on('ready', () => {
      this.makeDOM();
      this.updateDOM();

      engine.inputs.bind('tab', this.openDOM, 'in-game', { occasion: 'keydown' });
      engine.inputs.bind('tab', this.closeDOM, 'in-game', { occasion: 'keyup' });
    });
  }

  openDOM = () => {
    this.updateDOM();
    this.wrapper.style.display = 'block';
  };

  closeDOM = () => {
    this.wrapper.style.display = 'none';
  };

  makeDOM = () => {
    this.wrapper = document.createElement('ul');

    Helper.applyStyle(this.wrapper, {
      width: '200px',
      zIndex: '10000',
      minHeight: '20px',
      fontSize: '1em',
      top: '1vh',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.133)',
      position: 'fixed',
      listStyle: 'none',
      color: 'white',
      display: 'none',
    });

    this.engine.container.domElement.appendChild(this.wrapper);
  };

  updateDOM = () => {
    this.wrapper.innerHTML = '';

    const peerNames = Array.from(this.players.values()).map((p) => p.name);
    peerNames.push(this.engine.player.name);

    peerNames.forEach((pn) => {
      const newEle = document.createElement('li');
      Helper.applyStyle(newEle, {
        textAlign: 'left',
        padding: '2px 10px',
        borderBottom: '2px solid rgba(0, 0, 0, 0.222)',
      });
      newEle.innerHTML = pn;
      this.wrapper.appendChild(newEle);
    });
  };

  join = (id: string) => {
    const newPlayer = new Peer(id);

    this.engine.rendering.scene.add(newPlayer.mesh);
    this.players.set(id, newPlayer);
  };

  update = (id: string, packet: PacketType) => {
    if (!this.players.has(id)) {
      // might have missed the player's join event
      this.join(id);
    }

    const player = this.players.get(id);

    const { name, position, rotation } = packet;

    if (name !== player.name) this.updateDOM();
    player.update(name, new Vector3(...position), new Quaternion(...rotation));
  };

  leave = (id: string) => {
    const player = this.players.get(id);

    if (!player) return;

    this.engine.rendering.scene.remove(player.mesh);
    this.players.delete(id);
  };

  tick = () => {
    this.players.forEach((peer) => {
      peer.tick(this.engine.player.object.position);
    });
  };
}

export { Peers, PeersOptionsType };
