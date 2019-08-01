import {
  RUN_COMMAND_MUTATION,
  MESSAGE_SUBSCRIPTION
} from '../../../lib/graphql'
import Helpers from '../../../utils/helpers'

import classes from './chat.module.css'
import Message from './message/message'
import ChatHistory from './chatHistory/chatHistory'

const HELP_COMMAND = `
/gamemode (creative|spectator|survival)</br>
/time (set) (day|night|&lt;value&gt;)
`

class Chat {
  constructor(playerId, worldId, container, apolloClient) {
    this.state = {
      enabled: false
    }

    this.messages = []
    this.playerId = playerId
    this.worldId = worldId
    this.apolloClient = apolloClient

    this.chatHistory = new ChatHistory(this)

    this.initDom(container)
    this.initSubscriptions()
  }

  initDom = container => {
    this.gui = {
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

  initSubscriptions = () => {
    this.chatSubscription = this.apolloClient
      .subscribe({
        query: MESSAGE_SUBSCRIPTION,
        variables: { worldId: this.worldId }
      })
      .subscribe({
        next: ({
          data: {
            message: { node }
          }
        }) => {
          this.addMessage(node)
        },
        error(e) {
          Helpers.error(e.message)
        }
      })
  }

  handleEnter = () => {
    const value = this.getInput()

    if (value.split(' ').filter(ele => ele).length === 0) return

    if (value === '/help') {
      this.addMessage({ type: 'SERVER', body: HELP_COMMAND })
      return
    }

    this.apolloClient.mutate({
      mutation: RUN_COMMAND_MUTATION,
      variables: {
        worldId: this.worldId,
        playerId: this.playerId,
        command: value
      }
    })

    this.chatHistory.add(value)
    this.chatHistory.getReady()
  }

  handleUp = () => {
    const previous = this.chatHistory.previous()

    if (Helpers.isString(previous)) this.setInput(previous)
  }

  handleDown = () => {
    const next = this.chatHistory.next()

    if (Helpers.isString(next)) this.setInput(next)
  }

  addMessage = ({ type, sender, body }) => {
    const newMessage = new Message(type, sender, body)

    this.messages.push(newMessage)
    this.gui.messagesWrapper.appendChild(newMessage.getGui())

    // MIGHT CHANGE FUNCTION NAME SINCE THIS DISPLAYS THE CHAT THEN FADES IT AWAY
    this.disable()
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
    }
    const halfDisabledStyle = {
      opacity: '0.8'
    }

    Helpers.applyStyle(this.gui.input, disabledStyle)
    Helpers.applyStyle(this.gui.wrapper, halfDisabledStyle)

    this.blurInput()
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

  resetInput = () => (this.gui.input.value = '')

  setInput = value => (this.gui.input.value = value)

  getInput = () => this.gui.input.value

  getSubscription = () => this.chatSubscription

  focusInput = () => this.gui.input.focus()

  blurInput = () => this.gui.input.blur()

  terminate = () => {
    this.chatSubscription.unsubscribe()
    // delete this.chatSubscription
  }
}

export default Chat
