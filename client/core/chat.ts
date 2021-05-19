import { Engine } from '.';

class Chat {
  public enabled = false;

  constructor(public engine: Engine) {
    engine.inputs.bind('t', this.enable, 'in-game');
  }

  enable = (isCommand = false) => {
    this.enabled = true;
    this.engine.unlock();
    this.engine.emit('chat-enabled');
  };

  disable = () => {
    this.enabled = false;
    this.engine.lock();
    this.engine.emit('chat-disabled');
  };
}

export { Chat };
