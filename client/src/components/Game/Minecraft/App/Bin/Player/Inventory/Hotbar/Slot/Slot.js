import Helpers from '../../../../../../Utils/Helpers'

class Slot {
	constructor() {
		this.wrapper = document.createElement('div')
		Helpers.applyStyle(this.wrapper, {
			display: 'block',
			position: 'relative',
			border: '1px grey solid'
		})

		this.child = document.createElement('img')
		Helpers.applyStyle(this.child, {
			display: 'block',
			backgroundColor: 'rgba(0, 0, 0, 0.3)',
			border: '3px #605D5E solid',
			padding: '3px',
			width: '40px',
			height: '40px'
		})

		this.count = document.createElement('p')
		Helpers.applyStyle(this.count, {
			display: 'inline',
			position: 'absolute',
			bottom: '3px',
			right: '3px',
			fontSize: '1.2em',
			fontWeight: '300',
			color: '#eeeeee',
			fontFamily: "'Londrina Solid', cursive"
		})

		this.wrapper.appendChild(this.child)
		this.wrapper.appendChild(this.count)
	}

	set = (texture, count) => {
		this.count.innerHTML = count
		this.child.src = texture
	}

	getUI = () => this.wrapper

	select = () => {
		Helpers.applyStyle(this.child, {
			border: '4px #c4c4c4 solid'
		})
		Helpers.applyStyle(this.wrapper, {
			border: '1px black solid'
		})
	}

	deselect = () => {
		Helpers.applyStyle(this.child, {
			border: '3px #605D5E solid'
		})
		Helpers.applyStyle(this.wrapper, {
			border: '1px grey solid'
		})
	}
}

export default Slot
