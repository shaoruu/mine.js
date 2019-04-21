import Helpers from '../../../../../Utils/Helpers'
import Slot from './Slot/Slot'

class Hotbar {
	constructor(cursor, data, materialManager) {
		this.selectedIndex = cursor

		this.items = []
		this.materialManager = materialManager

		this.init(data)
	}

	/** Take in data and then create UI */
	init = data => {
		const wrapper = document.createElement('div')

		Helpers.applyStyle(wrapper, {
			alignSelf: 'flex-end',

			margin: '15px',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		})

		for (let i = 0; i < 9; i++) {
			this.items.push(new Slot())
			wrapper.appendChild(this.items[i].getUI())
		}

		// sample data: [{ type: 1, count: 23 }, {}, {}, {}, {}, {}, {}, {}, {}]
		data.forEach((slot, index) => {
			if (!slot.type) return

			const { type, count } = slot
			const { side: texture } = this.materialManager.getImage(type)

			this.items[index].set(texture, count)
		})

		this.items[this.selectedIndex].select()

		this.element = wrapper
	}

	getGui = () => this.element

	select = index => {
		this.items[this.selectedIndex].deselect()
		this.items[index].select()
		this.selectedIndex = index
	}
}

export default Hotbar
