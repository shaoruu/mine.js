import { Engine } from '.';

type ChatOptionsType = {
  input: HTMLInputElement;
};

class Chat {
  public enabled = false;

  public input: HTMLInputElement;

  constructor(public engine: Engine, public options: ChatOptionsType) {
    engine.inputs.bind('t', this.enable, 'in-game');
    engine.inputs.bind('esc', this.disable, 'chat', 'keyup');
  }

  enable = (isCommand = false) => {
    this.engine.unlock();
    this.engine.emit('chat-enabled');
    this.enabled = true;

    const interval = setInterval(() => {
      const input = document.getElementById('chat') as HTMLInputElement;
      if (!input) return;

      input.focus();
      input.addEventListener(
        'keyup',
        (e) => {
          if (e.key === 'Escape') {
            this.disable();
          }
        },
        false,
      );
      clearInterval(interval);
    }, 1);
  };

  disable = () => {
    this.enabled = false;
    this.engine.lock(() => {
      this.engine.emit('chat-disabled');
    });
  };
}

export { Chat, ChatOptionsType };
