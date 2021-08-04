import { EventEmitter } from 'events';

import { Tween } from '@tweenjs/tween.js';
import { AudioLoader, PositionalAudio, Vector3, Object3D } from 'three';

import { Coords3 } from '../libs/types';

import { Engine } from '.';

type SoundsOptionsType = {
  maxTracks: number;
};

type TrackOptions = {
  loop: boolean;
  multiple: boolean;
  maxVolume: number;
  refDistance: number;
  fadeTime: number;
};

const defaultTrackOptions: TrackOptions = {
  loop: false,
  multiple: true,
  maxVolume: 1,
  refDistance: 10,
  fadeTime: 300,
};

class Sounds extends EventEmitter {
  public tracks: Map<string, { buffer: AudioBuffer; options: TrackOptions }>;
  public audios: Map<string, { audio: PositionalAudio; tween: Tween<any> }>;

  private loader: AudioLoader;

  constructor(public engine: Engine, public options: SoundsOptionsType) {
    super();

    this.tracks = new Map();
    this.audios = new Map();

    this.loader = new AudioLoader();
  }

  add = (name: string, source: string, options: Partial<TrackOptions> = {}) => {
    if (this.tracks.size >= this.options.maxTracks) {
      console.error("Max tracks exceeded, can't add audio.");
      return;
    }

    const opts: TrackOptions = { ...defaultTrackOptions, ...options };

    this.loader.load(source, (buffer) => {
      this.tracks.set(name, { buffer, options: opts });
    });
  };

  remove = (name: string) => {
    this.audios.delete(name);
    this.tracks.delete(name);
  };

  play = (name: string, { position, object }: { position?: Coords3; object?: Object3D }) => {
    const track = this.getTrack(name);
    if (!track) return;

    const { buffer, options } = track;
    const { loop, multiple, refDistance, maxVolume, fadeTime } = options;

    if (this.audios.has(name) && !multiple) {
      const pack = this.audios.get(name);

      // means it was in the midst stopping
      if (pack.tween) {
        if (pack.audio.getVolume() !== maxVolume) {
          pack.tween.to({ volume: maxVolume }).duration(fadeTime).start();
        }
      } else {
        const { audio } = pack;

        if (!audio.isPlaying) {
          audio.setVolume(1);
          audio.play();

          pack.tween = new Tween({ volume: maxVolume })
            .duration(fadeTime)
            .onUpdate(({ volume }) => audio.setVolume(volume));

          this.emit('started', name);
        }
      }

      return;
    }

    const sound = new PositionalAudio(this.engine.camera.audioListener);

    sound.loop = loop;

    sound.setVolume(maxVolume);
    sound.setBuffer(buffer);
    sound.setRefDistance(refDistance);

    if (object) {
      object.add(sound);
    } else {
      if (!position) {
        console.error(`Nor position or object supplied, can't play audio: ${name}`);
        return;
      }

      sound.position.set(...position);
      this.engine.rendering.scene.add(sound);
    }

    sound.play();
    this.emit('started', name);

    sound.source.onended = () => {
      if (!sound.loop) {
        sound.parent.remove(sound);
        this.emit('stopped', name);
      }
    };

    if (multiple && loop) {
      console.warn('Playing multiple audio while on loop can lead to unstoppable SFX.');
    }

    if (!multiple) {
      this.audios.set(name, {
        audio: sound,
        tween: new Tween({ volume: maxVolume }).duration(fadeTime).onUpdate(({ volume }) => sound.setVolume(volume)),
      });
    }
  };

  pause = (name: string) => {
    const pack = this.getAudio(name);
    if (pack && pack.tween) {
      if (pack.audio.getVolume() !== 0) {
        pack.tween
          .to({ volume: 0 })
          .start()
          .onComplete(() => {
            pack.tween = null;
            pack.audio.pause();

            this.emit('stopped', name);
          });
      }
    }
  };

  getTrack = (name: string) => {
    const track = this.tracks.get(name);

    if (!track) {
      return;
    }

    return track;
  };

  getAudio = (name: string) => {
    const audio = this.audios.get(name);

    if (!audio) {
      return;
    }

    return audio;
  };
}

export { Sounds, SoundsOptionsType };
