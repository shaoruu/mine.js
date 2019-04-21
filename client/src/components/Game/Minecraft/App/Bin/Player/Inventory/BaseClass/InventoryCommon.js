import Slot from '../Hotbar/Slot/Slot'

class InventoryCommon {
	constructor(maxLength, materialManager) {
		this.items = []

		this.initSlots(maxLength, materialManager)
	}

	initSlots = (maxLength, materialManager) => {
		for (let i = 0; i < maxLength; i++) {
			this.items.push(new Slot(materialManager))
		}
	}

	add = (type, count) => {
		let tempCount = count

		// Appending to existing slots with same type
		for (let i = 0; i < this.items.length; i++) {
			const slot = this.items[i]
			if (slot.type === type) {
				if (slot.isFull) continue

				const leftover = slot.append(tempCount)

				if (!leftover) return 0
				else tempCount = leftover
			}
		}

		if (tempCount === 0) console.log('wtf')

		for (let i = 0; i < this.items.length; i++) {
			const slot = this.items[i]
			if (slot.isEmpty) {
				const leftover = slot.set(type, tempCount)

				if (!leftover) return 0
				else tempCount = leftover
			}
		}

		return tempCount
	}

	getDatabaseRepresentation(name) {
		return (
			name +
			':' +
			this.items.map(slot => `${slot.getType()},${slot.getCount()};`).join('')
		)
	}
}

export default InventoryCommon
