import classes from './Chat.module.css'
import Helpers from '../../../Utils/Helpers'
import { RUN_COMMAND_MUTATION } from '../../../../../../lib/graphql'

class Chat {
  constructor(username, worldId, container, apolloClient) {
    this.state = {
      enabled: false
    }

    this.messages = []
    this.username = username
    this.worldId = worldId
    this.apolloClient = apolloClient

    this.initDom(container)
  }

  initDom = container => {
    this.gui = {
      // textbox: document.createElement('input'),
      messages: document.createElement('ul'),
      messagesWrapper: document.createElement('div'),
      wrapper: document.createElement('div'),
      input: document.createElement('input')
    }

    Helpers.applyStyle(this.gui.wrapper, classes.wrapper)
    Helpers.applyStyle(this.gui.messagesWrapper, classes.messagesWrapper)
    Helpers.applyStyle(this.gui.input, classes.input)

    this.gui.input.type = 'text'
    this.gui.input.autocapitalize = 'off'
    this.gui.input.autocomplete = 'off'
    this.gui.input.autofocus = 'off'
    this.gui.input.spellcheck = false

    this.gui.wrapper.appendChild(this.gui.messagesWrapper)

    this.focusListener = this.gui.wrapper.addEventListener('click', () =>
      this.focusInput()
    )

    container.appendChild(this.gui.input)
    container.appendChild(this.gui.wrapper)
  }

  handleEnter = () => {
    const value = this.getInput()

    this.apolloClient.mutate({
      mutation: RUN_COMMAND_MUTATION,
      variables: {
        worldId: this.worldId,
        username: this.username,
        command: value
      }
    })

    // if (value.startsWith('/')) {
    //   const args = value.substr(1).split(' ')

    //   switch (args[0]) {
    //     case 'gamemode': {
    //       switch (args[1]) {
    //         case 's':
    //         case 'survival':
    //         case '0': {
    //           // TEMP

    //           console.log('going survival')
    //           break
    //         }

    //         case 'c':
    //         case 'creative':
    //         case '1': {
    //           // TEMP

    //           console.log('going creative')
    //           break
    //         }

    //         case 'sp':
    //         case 'spectator':
    //         case '3': {
    //           // TEMP

    //           console.log('going spectator')
    //           break
    //         }

    //         default:
    //           break
    //       }
    //       break
    //     }
    //     default:
    //       break
    //   }
    // }
  }

  getGui = () => this.gui.textbox
  get enabled() {
    return this.state.enabled
  }

  enable = (isT = true) => {
    if (this.disappearTimer) clearTimeout(this.disappearTimer)

    this.state.enabled = true

    const enabledStyle = {
      opacity: '1',
      transition: 'all 0s ease 0s'
    }

    Helpers.applyStyle(this.gui.wrapper, enabledStyle)
    Helpers.applyStyle(this.gui.input, enabledStyle)

    this.focusInput()
    this.resetInput()

    if (isT) setTimeout(() => this.setInput(this.getInput().substr(1)), 0.01)
  }

  disable = () => {
    this.state.enabled = false

    const disabledStyle = {
        transition: 'opacity 1s ease-out',
        opacity: '0'
      },
      halfDisabledStyle = {
        opacity: '0.8'
      }

    Helpers.applyStyle(this.gui.input, disabledStyle)
    Helpers.applyStyle(this.gui.wrapper, halfDisabledStyle)

    this.resetInput()

    this.disappearTimer = setTimeout(() => {
      Helpers.applyStyle(this.gui.wrapper, disabledStyle)
      this.disappearTimer = undefined
    }, 2000)
  }

  toggle = () => {
    if (this.state.enabled) this.disable()
    else this.enable()
  }

  addMessage = ({ sender, body }) => {}

  resetInput = () => (this.gui.input.value = '')

  setInput = value => (this.gui.input.value = value)

  getInput = () => this.gui.input.value

  focusInput = () => this.gui.input.focus()
}

export default Chat
