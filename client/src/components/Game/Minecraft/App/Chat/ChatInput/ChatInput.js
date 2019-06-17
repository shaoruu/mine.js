import ChatCharacter from './ChatCharacter/ChatCharacter'
import classes from './ChatInput.module.css'
import Helpers from '../../../../Utils/Helpers'

class ChatInput {
  constructor() {
    this.pointer = 0

    this.chars = []

    this.initDOM()
  }

  initDOM = () => {
    this.wrapper = document.createElement('div')

    Helpers.applyStyle(this.wrapper, classes.wrapper)

    this._appendEmptySpace()
  }

  select = pointer => {
    if (pointer < 0 || pointer >= this.chars.length) return

    this.chars[this.pointer].unhighlight()
    this.chars[pointer].highlight()
    this.pointer = pointer
  }

  moveLeft = () => this.select(this.pointer - 1)
  moveRight = () => this.select(this.pointer + 1)

  insert = char => {
    const newChar = new ChatCharacter(char)
    this.chars.splice(this.pointer, 0, newChar)
    this.wrapper.insertBefore(
      newChar.getUI(),
      this.wrapper.children[this.pointer]
    )
    this.pointer++
  }

  get entireLine() {
    return this.chars.map(cc => cc.getChar()).join('')
  }

  reset = () => {
    this.pointer = 0
    this.chars = []

    while (this.wrapper.firstChild) {
      this.wrapper.removeChild(this.wrapper.firstChild)
    }

    this._appendEmptySpace()
  }

  getGUI = () => this.wrapper

  _appendEmptySpace = () => {
    const initials = new ChatCharacter(' ')
    this.wrapper.appendChild(initials.getUI())
    this.chars.push(initials)
  }
}

export default ChatInput
