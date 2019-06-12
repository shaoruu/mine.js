import classes from './Chat.module.css'
import Helpers from '../../../Utils/Helpers'
import ChatInput from './ChatInput/ChatInput'

class Chat {
  constructor(container) {
    this.state = {
      enabled: false
    }

    this.messages = []

    this.initDom(container)
  }

  initDom = container => {
    this.gui = {
      // textbox: document.createElement('input'),
      messages: document.createElement('ul'),
      messagesWrapper: document.createElement('div'),
      wrapper: document.createElement('div')
    }

    Helpers.applyStyle(this.gui.wrapper, classes.wrapper)
    Helpers.applyStyle(this.gui.messagesWrapper, classes.messagesWrapper)

    this.gui.wrapper.appendChild(this.gui.messagesWrapper)

    // Chat input
    this.input = new ChatInput()

    container.appendChild(this.input.getGUI())
    container.appendChild(this.gui.wrapper)
  }

  handleEnter = () => {
    console.log(this.input.entireLine)
  }

  getGui = () => this.gui.textbox
  get enabled() {
    return this.state.enabled
  }

  enable = () => {
    if (this.disappearTimer) clearTimeout(this.disappearTimer)

    this.state.enabled = true

    const enabledStyle = {
      opacity: '1',
      transition: 'all 0s ease 0s'
    }

    Helpers.applyStyle(this.gui.wrapper, enabledStyle)
    Helpers.applyStyle(this.input.getGUI(), enabledStyle)
  }

  disable = () => {
    this.state.enabled = false
    this.input.reset()

    const disabledStyle = {
        transition: 'opacity 1s ease-out',
        opacity: '0'
      },
      halfDisabledStyle = {
        opacity: '0.8'
      }

    Helpers.applyStyle(this.input.getGUI(), disabledStyle)
    Helpers.applyStyle(this.gui.wrapper, halfDisabledStyle)

    this.disappearTimer = setTimeout(() => {
      Helpers.applyStyle(this.gui.wrapper, disabledStyle)
      this.disappearTimer = undefined
    }, 3000)
  }

  toggle = () => {
    if (this.state.enabled) this.disable()
    else this.enable()
  }

  addMessage = ({ sender, body }) => {}
}

export default Chat
