import Armor from './Armor/Armor'
import Backpack from './Backpack/Backpack'
import Hotbar from './Hotbar/Hotbar'
import Helpers from '../../../../Utils/Helpers'

class Inventory {
	constructor(container, materialManager, cursor, data, updatePlayer) {
		const { hotbar } = this._digestInventory(data)

		this.armor = new Armor()

		this.backpack = new Backpack()

		this.hotbar = new Hotbar(cursor, hotbar, materialManager)

		this.updatePlayer = updatePlayer

		this.init(container)
	}

	init = container => {
		const wrapper = document.createElement('div')

		wrapper.appendChild(this.hotbar.getGui())

		Helpers.applyStyle(wrapper, {
			position: 'fixed',
			top: '0',
			width: '100vw',
			height: '100vh',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			userSelect: 'none'
		})

		container.appendChild(wrapper)
	}

	switchHotbar = index => {
		if (index <= 8 && index >= 0) {
			this.hotbar.select(index)
		}
	}

	getCursor = () => this.hotbar.selectedIndex

	_digestInventory = data => {
		// Default data: "ARMOR:(0;) * 4|BACKPACK:(0,0;) * 27|HOTBAR:(0,0;) * 9"
		const inventory = data.split('|')

		const armor = inventory[0]
			.split(':')[1]
			.split(';')
			.filter(ele => ele)
			.map(ele => parseInt(ele))

		const backpack = inventory[1]
			.split(':')[1]
			.split(';')
			.filter(ele => ele)
			.map(ele => {
				const splitted = ele.split(',').map(e => parseInt(e))
				return { type: splitted[0], count: splitted[1] }
			})

		const hotbar = inventory[2]
			.split(':')[1]
			.split(';')
			.filter(ele => ele)
			.map(ele => {
				const splitted = ele.split(',').map(e => parseInt(e))
				return { type: splitted[0], count: splitted[1] }
			})

		return { armor, backpack, hotbar }
	}
}

export default Inventory
