import Helpers from '../../../../../../Utils/Helpers'

class Slot {
	constructor(materialManager) {
		this.gui = {
			wrapper: document.createElement('div'),
			itemWrapper: document.createElement('div'),
			item: document.createElement('img'),
			count: document.createElement('p')
		}

		this.count = 0
		this.type = 0

		this.materialManager = materialManager

		this.initDoms()
	}

	initDoms = () => {
		Helpers.applyStyle(this.gui.wrapper, {
			display: 'block',
			position: 'relative',
			border: '1px grey solid',
			webkitUserSelect: 'none'
		})

		Helpers.applyStyle(this.gui.itemWrapper, {
			display: 'block',
			backgroundColor: 'rgba(0, 0, 0, 0.3)',
			border: '3px #605D5E solid',
			padding: '3px',
			width: '40px',
			height: '40px',
			webkitUserSelect: 'none'
		})

		Helpers.applyStyle(this.gui.item, {
			width: '100%',
			height: '100%'
		})

		Helpers.applyStyle(this.gui.count, {
			display: 'inline',
			position: 'absolute',
			bottom: '3px',
			right: '3px',
			fontSize: '15px',
			fontWeight: '300',
			color: '#eeeeee',
			fontFamily: 'Minecraft',
			webkitUserSelect: 'none'
		})

		this.gui.itemWrapper.appendChild(this.gui.item)
		this.gui.wrapper.appendChild(this.gui.itemWrapper)
		this.gui.wrapper.appendChild(this.gui.count)
	}

	init = (type, count) => {
		this.setType(type)
		this.setCount(count)
	}

	set = (type, count) => {
		let leftover = count - 64

		this.setType(type)
		this.setCount(count > 64 ? 64 : count)

		return leftover < 0 ? 0 : leftover
	}
	append = count => {
		let c = this.count + count

		let leftover = 0

		if (c > 64) {
			c = 64
			leftover = c - 64
		}

		this.setCount(c)

		return leftover < 0 ? 0 : leftover
	}
	take = amount => {
		this.count -= amount
		if (this.count <= 0) this.reset()
		this.update()
	}

	reset = () => {
		this.setType(0)
		this.setCount(0)
	}
	update = () => {
		this.setGuiCount(this.count)
		this.setGuiItem(this.type)
	}

	getUI = () => this.gui.wrapper
	getType = () => this.type
	getCount = () => this.count
	get isEmpty() {
		return this.count === 0
	}
	get isFull() {
		return this.count === 64
	}

	setType = type => {
		this.type = type
		this.setGuiItem(type)
	}
	setCount = count => {
		this.count = count
		this.setGuiCount(count)
	}
	setGuiCount = count => (this.gui.count.innerHTML = count <= 1 ? '' : count)
	setGuiItem = type => {
		if (type === 0) this.setTexture(null)
		else {
			const image = this.materialManager.getImage(type)
			this.setTexture(image)
		}
	}
	setTexture = image => {
		if (!image) Helpers.applyStyle(this.gui.item, { opacity: 0 })
		else {
			Helpers.applyStyle(this.gui.item, { opacity: 1 })
			this.gui.item.src = image.side
		}
	}

	select = () => {
		Helpers.applyStyle(this.gui.itemWrapper, {
			border: '3px #c4c4c4 solid'
		})
		Helpers.applyStyle(this.gui.wrapper, {
			border: '1px black solid'
		})
	}

	deselect = () => {
		Helpers.applyStyle(this.gui.itemWrapper, {
			border: '4px #605D5E solid'
		})
		Helpers.applyStyle(this.gui.wrapper, {
			border: '1px grey solid'
		})
	}
}

export default Slot
