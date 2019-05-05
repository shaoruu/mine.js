import classes from './Hotbar.module.css'
import Helpers from '../../../../../Utils/Helpers'
import InventoryCommon from '../BaseClass/InventoryCommon'

class Hotbar extends InventoryCommon {
	constructor(cursor, data, resourceManager) {
		super(9, resourceManager)

		this.selectedIndex = cursor

		this.init(data)
	}

	/** Take in data and then create UI */
	init = data => {
		const wrapper = document.createElement('div')

		Helpers.applyStyle(wrapper, classes.wrapper)

		data.forEach((slot, index) => {
			wrapper.appendChild(this.items[index].getUI())

			const { type, count } = slot

			this.items[index].init(type, count)
		})

		this.items[this.selectedIndex].select()

		this.element = wrapper
	}

	getGui = () => this.element
	getHand = () => this.items[this.selectedIndex].type

	takeFromHand = amount => {
		this.items[this.selectedIndex].take(amount)
	}

	select = index => {
		this.items[this.selectedIndex].deselect()
		this.items[index].select()
		this.selectedIndex = index
	}
}

export default Hotbar
