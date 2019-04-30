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

		const initials = new ChatCharacter(' ')
		this.wrapper.appendChild(initials.getUI())
		this.chars.push(initials)
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
		this.chars.push(newChar)
		this.wrapper.appendChild(newChar.getUI())
	}

	get entireLine() {
		return this.chars.map(cc => cc.getChar()).join('')
	}

	reset = () => {
		this.chars = []

		while (this.wrapper.firstChild) {
			this.wrapper.removeChild(this.wrapper.firstChild)
		}
	}

	getGUI = () => this.wrapper
}

export default ChatInput
