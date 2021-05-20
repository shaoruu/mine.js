import { MESSAGE_TYPE } from '../../shared';
import { Helper } from '../utils';

class Message {
  public wrapper = document.createElement('li');
  public sender = document.createElement('p');
  public body = document.createElement('p');

  constructor(public type: MESSAGE_TYPE, sender?: string, body?: string) {
    Helper.applyStyle(this.wrapper, {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '0 5px 5px 5px',
    });

    Helper.applyStyle([this.sender, this.body], {
      fontFamily: "'Alata', sans-serif",
      fontSize: '16px',
      color: 'white',
    });

    Helper.applyStyle(this.sender, {
      width: 'fit-content',
      flexShrink: '0',
    });

    this.sender.innerHTML = sender || '';
    this.body.innerHTML = body || '';

    switch (type) {
      case 'ERROR':
        Helper.applyStyle([this.sender, this.body], {
          color: '#f14668',
        });
        break;
      case 'SERVER':
        Helper.applyStyle([this.sender, this.body], {
          color: '#29bb89',
        });
        break;
      case 'PLAYER':
        this.sender.innerHTML = `&lt;${sender}&gt;`;
        this.body.innerHTML = `&nbsp;&nbsp;${body}`;
        break;
      case 'INFO':
        Helper.applyStyle([this.sender, this.body], {
          color: '#fed049',
        });
        break;
      default:
        break;
    }

    this.wrapper.appendChild(this.sender);
    this.wrapper.appendChild(this.body);
  }
}

export { Message };
