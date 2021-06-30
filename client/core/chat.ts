import { ChatHistory, Message } from '../libs';
import { MESSAGE_TYPE } from '../libs/types';
import { Helper } from '../utils';

import { Engine } from '.';

type ChatOptionsType = {
  margin: number;
  disappearTimeout: number;
};

const HELP_TEXT = `
Basic controls of the game:
- <span>T</span>: Toggle chat
- <span>F</span>: Toggle physics
- <span>C</span>: Toggle perspective
- <span>0-9</span>: Change block
- <span>Space</span>: Jump / fly up
- <span>W/A/S/D</span>: Movements
- <span>L-Shift</span>: Fly down
- <span>L-Mouse</span>: Break block
- <span>R-Mouse</span>: Place block
`;

class Chat {
  public enabled = false;

  public messages: Message[] = [];
  public history = new ChatHistory(this);

  public gui: {
    messages: HTMLUListElement;
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
  };

  private disappearTimer: NodeJS.Timeout;

  constructor(public engine: Engine, public options: ChatOptionsType) {
    this.makeDOM();

    engine.inputs.bind('t', this.enable, 'in-game');
    engine.inputs.bind('/', () => this.enable(true), 'in-game');
    engine.inputs.bind('esc', this.disable, 'chat', { occasion: 'keyup' });

    engine.on('connected', () => this.add({ type: 'SERVER', body: 'Connected to world! Try /help' }));
    engine.on('disconnected', () => this.add({ type: 'ERROR', body: 'World disconnected. Reconnecting...' }));
  }

  makeDOM = () => {
    const { margin } = this.options;

    this.gui = {
      messages: document.createElement('ul'),
      wrapper: document.createElement('div'),
      input: document.createElement('input'),
    };

    this.gui.wrapper.id = 'mine.js-chat-wrapper';

    Helper.applyStyle(this.gui.wrapper, {
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '4',
      width: '100vw',
      height: '100vh',
      visibility: 'hidden',
    });

    Helper.applyStyle(this.gui.messages, {
      position: 'fixed',
      bottom: '75px',
      left: '0',
      width: '40%',
      marginLeft: `${margin}px`,
      maxHeight: '50%',
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.45)',
      wordBreak: 'break-all',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      listStyle: 'none',
    });

    Helper.applyStyle(this.gui.input, {
      position: 'fixed',
      bottom: '0',
      left: '0',
      width: `calc(100% - ${margin * 2}px)`,
      margin: `${margin}px`,
      height: '29px',
      background: 'rgba(0,0,0,0.45)',
      padding: '5px',
      zIndex: '5',
      fontFamily: "'Alata', sans-serif",
      fontSize: '16px',
      color: 'white',
      border: 'none',
      outline: 'none',
      visibility: 'hidden',
    });

    this.gui.input.type = 'text';
    this.gui.input.autocapitalize = 'off';
    this.gui.input.autocomplete = 'off';
    // @ts-ignore
    this.gui.input.autofocus = false;
    this.gui.input.spellcheck = false;
    this.gui.input.maxLength = 256;

    this.gui.wrapper.addEventListener('click', this.focusInput, false);

    this.gui.wrapper.appendChild(this.gui.messages);

    this.engine.container.domElement.appendChild(this.gui.wrapper);
    this.engine.container.domElement.appendChild(this.gui.input);

    this.gui.input.addEventListener(
      'keyup',
      (e) => {
        if (this.engine.inputs.namespace !== 'chat') return;

        switch (e.key) {
          case 'Escape':
            this.disable();
            break;
          case 'Enter':
            this.handleEnter();
            this.disable();
            break;
          case 'ArrowUp':
            this.handleUp();
            break;
          case 'ArrowDown':
            this.handleDown();
            break;
        }
      },
      false,
    );
  };

  handleEnter = () => {
    const value = this.inputValue;

    if (value.split(' ').filter((ele) => ele).length === 0) return;

    const {
      network: { server },
      player,
    } = this.engine;

    if (value === '/help') {
      this.add({ type: 'INFO', body: HELP_TEXT });
      return;
    }

    if (value.startsWith('/')) {
      this.add({ type: 'INFO', body: 'Commands coming soon!' });
      return;
    }

    server.sendEvent({
      type: 'MESSAGE',
      message: {
        type: 'PLAYER',
        sender: player.name,
        body: value,
      },
    });

    this.history.add(value);
    this.history.reset();
  };

  handleUp = () => {
    const previous = this.history.previous();
    if (previous) this.inputValue = previous;
  };

  handleDown = () => {
    const next = this.history.next();
    if (next) this.inputValue = next;
  };

  add = ({ type, sender, body }: { type: MESSAGE_TYPE; sender?: string; body?: string }) => {
    const newMessage = new Message(type, sender, body);

    this.messages.push(newMessage);
    this.gui.messages.appendChild(newMessage.wrapper);

    this.showMessages();
    if (!this.enabled) {
      this.fadeMessages();
    }
  };

  enable = (isCommand = false) => {
    if (this.disappearTimer) {
      clearTimeout(this.disappearTimer);
    }

    this.enabled = true;
    this.engine.unlock();
    this.engine.emit('chat-enabled');

    this.resetInput();
    this.showInput();
    this.focusInput();
    this.showMessages();

    if (isCommand) {
      this.inputValue = '/';
    }
  };

  disable = () => {
    this.enabled = false;

    this.fadeMessages();
    this.blurInput();
    this.resetInput();
    this.hideInput();

    this.engine.lock(() => {
      this.engine.emit('chat-disabled');
    });
  };

  showMessages = () => {
    Helper.applyStyle(this.gui.wrapper, { opacity: '1', visibility: 'visible', transition: 'all 0s ease 0s' });
  };

  showInput = () => {
    Helper.applyStyle(this.gui.input, { visibility: 'visible' });
  };

  fadeMessages = () => {
    if (this.disappearTimer) {
      clearTimeout(this.disappearTimer);
    }

    Helper.applyStyle(this.gui.wrapper, { opacity: '0.8' });

    this.disappearTimer = setTimeout(() => {
      Helper.applyStyle(this.gui.wrapper, {
        opacity: '0',
        transition: 'opacity 1s ease-out',
      });
      clearTimeout(this.disappearTimer);
      this.disappearTimer = undefined;
    }, this.options.disappearTimeout);
  };

  hideInput = () => {
    Helper.applyStyle(this.gui.input, { visibility: 'hidden' });
  };

  resetInput = () => (this.inputValue = '');

  focusInput = () => this.gui.input.focus();

  blurInput = () => this.gui.input.blur();

  set inputValue(value: string) {
    this.gui.input.value = value;
  }

  get inputValue() {
    return this.gui.input.value;
  }
}

export { Chat, ChatOptionsType };
