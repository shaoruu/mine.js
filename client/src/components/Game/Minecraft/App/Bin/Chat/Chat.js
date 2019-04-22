class Chat {
	constructor() {
		this.initDom()
	}

	initDom = () => {
		this.gui = {
			textbox: document.createElement('input'),
			messages: document.createElement('ul'),
			messagesWrapper: document.createElement('div'),
			wrapper: document.createElement('div')
		}
	}

	addMessage = ({ sender, body }) => {}
}

export default Chat
