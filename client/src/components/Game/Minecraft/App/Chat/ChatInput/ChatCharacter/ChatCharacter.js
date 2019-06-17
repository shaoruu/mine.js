import classes from './ChatCharacter.module.css'

function ChatCharacter(char) {
	const ui = document.createElement('span')
	ui.innerHTML = char

	ui.classList.add(classes.character)

	this.getUI = () => ui
	this.getChar = () => char

	this.highlight = () => ui.classList.add('blinking')
	this.unhighlight = () => ui.classList.remove('blinking')
}

export default ChatCharacter
