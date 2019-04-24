import classes from './Chat.module.css'
import Helpers from '../../../Utils/Helpers'

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
		container.appendChild(this.gui.wrapper)
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
					this.toggle()
					control.lock()
				}
			},
			false
		)
	}

	toggle = () => {
		this.state.enabled = !this.state.enabled
		Helpers.applyStyle(this.gui.wrapper, {
			visibility: this.state.enabled ? 'visible' : 'hidden'
		})
	}

	addMessage = ({ sender, body }) => {}
}

export default Chat
