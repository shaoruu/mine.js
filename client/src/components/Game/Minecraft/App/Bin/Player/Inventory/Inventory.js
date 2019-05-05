import Armor from './Armor/Armor'
import Backpack from './Backpack/Backpack'
import Hotbar from './Hotbar/Hotbar'
import Helpers from '../../../../Utils/Helpers'
import classes from './Inventory.module.css'

class Inventory {
	constructor(container, resourceManager, cursor, data, updatePlayer) {
		const { hotbar } = this._digestInventory(data)

		this.armor = new Armor()

		this.backpack = new Backpack()

		this.hotbar = new Hotbar(cursor, hotbar, resourceManager)

		this.updatePlayer = updatePlayer

		this.init(container)
	}

	init = container => {
		const wrapper = document.createElement('div')

		wrapper.appendChild(this.hotbar.getGui())

		Helpers.applyStyle(wrapper, classes.wrapper)

		container.appendChild(wrapper)
	}

	switchHotbar = index => {
		if (index <= 8 && index >= 0) {
			this.hotbar.select(index)
		}
	}

	add = (type, count) => {
		if (count === 0) return

		let leftover = this.hotbar.add(type, count)
		// if (leftover) leftover = this.backpack.add(type, count)

		// This means inventory is changed.
		if (leftover !== count) {
			// TODO: implement backpack
			this.updateInventory()
		}
	}

	getCursor = () => this.hotbar.selectedIndex
	getHand = () => this.hotbar.getHand()

	takeFromHand = amount => {
		this.hotbar.takeFromHand(amount)
		this.updateInventory()
	}

	// Update on server
	updateInventory = () => {
		const newInventory = `ARMOR:0;0;0;0|BACKPACK:0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;|${this.hotbar.getDatabaseRepresentation(
			'HOTBAR'
		)}`
		this.updatePlayer({ data: newInventory })
	}

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
