import Helpers from '../../../Utils/Helpers'

class ChatHistory {
  constructor(input) {
    this.messages = []
    this.cursor = -1

    this.temp = null
    this.input = input
  }

  add = message => this.messages.unshift(message)

  previous = () => {
    // Already at top
    if (!this.messages[this.cursor + 1]) return null

    if (!Helpers.isString(this.temp)) this.temp = this.input.getInput()

    this.cursor += 1

    return this.messages[this.cursor]
  }

  next = () => {
    // Already at bottom
    if (!this.messages[this.cursor - 1]) {
      if (Helpers.isString(this.temp)) {
        const temp = this.temp
        this.cursor -= 1
        this.temp = null
        return temp
      } else return null
    }

    this.cursor -= 1

    return this.messages[this.cursor]
  }

  getReady = () => {
    this.temp = null
    this.cursor = -1
  }
}

export default ChatHistory
