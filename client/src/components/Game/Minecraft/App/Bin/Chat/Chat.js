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
		this.input.reset()
	}

	getGui = () => this.gui.textbox
	get enabled() {
		return this.state.enabled
	}

	addControlListener = control => {
		// Add event listeners to control
		this.gui.wrapper.addEventListener(
			'click',
			e => {
				if (e.target === this.gui.wrapper) {
					control.lock()
					this.disable()
				}
			},
			false
		)
	}

	enable = () => {
		this.state.enabled = true

		const enabledStyle = {
			visibility: 'visible'
		}

		Helpers.applyStyle(this.gui.wrapper, enabledStyle)
		Helpers.applyStyle(this.input.getGUI(), enabledStyle)
	}

	disable = () => {
		this.state.enabled = false
		this.input.reset()

		const disabledStyle = {
			visibility: 'hidden'
		}

		Helpers.applyStyle(this.gui.wrapper, disabledStyle)
		Helpers.applyStyle(this.input.getGUI(), disabledStyle)
	}

	toggle = () => {
		if (this.state.enabled) this.disable()
		else this.enable()
	}

	addMessage = ({ sender, body }) => {}
}

export default Chat
