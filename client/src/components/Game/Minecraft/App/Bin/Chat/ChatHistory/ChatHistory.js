class ChatHistory {
	constructor() {
		this.messages = []
		this.cursor = 0

		this.temp = null
	}

	push = message => this.messages.push(message)

	previous = () => {
		if (this.cursor === this.messages.length - 1) return undefined

		// Saving the latest message if scrolling upwards
		if (!this.temp) temp = this.messages[this.cursor]

		return this.messages[++this.cursor]
	}

	next = () => {
		if (this.cursor === 0) return undefined

		this.cursor--
		if (this.cursor === 0) this.temp = null

		return this.messages[this.cursor]
	}
}

export default ChatHistory
