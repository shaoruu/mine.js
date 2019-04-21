import Helpers from '../../../../../Utils/Helpers'
import InventoryCommon from '../BaseClass/InventoryCommon'

class Hotbar extends InventoryCommon {
	constructor(cursor, data, materialManager) {
		super(9, materialManager)

		this.selectedIndex = cursor

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

		// sample data: [{ type: 1, count: 23 }, {}, {}, {}, {}, {}, {}, {}, {}]
		data.forEach((slot, index) => {
			wrapper.appendChild(this.items[index].getUI())

			if (!slot.type) return

			const { type, count } = slot

			this.items[index].init(type, count)
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
