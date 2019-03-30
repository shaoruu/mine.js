import * as THREE from 'three'

import PointerLockControls from '../../../Utils/PointerLockControls'
import Config from '../../../Data/Config'
import Helpers from '../../../Utils/Helpers'

// Controls based on orbit controls
export default class Controls {
	constructor(camera, scene, container, blocker, initPos, initDirs) {
		// Orbit controls first needs to pass in THREE to constructor
		this.threeControls = new PointerLockControls(camera, container, initPos, initDirs)

		this.prevTime = performance.now()

		this.velocity = new THREE.Vector3()
		this.direction = new THREE.Vector3()

		this.movements = {
			moveForward: false,
			moveBackward: false,
			moveLeft: false,
			moveRight: false,
			moveDown: false,
			moveUp: false
		}

		this.blocker = blocker

		this.init(scene)
	}

	init(scene) {
		this._initListeners()
		scene.add(this.getObject())

		// CONSTANTS
		this.INERTIA = Config.player.inertia
		this.HORIZONTAL_SPEED = Config.player.speed.horizontal
		this.VERTICAL_SPEED = Config.player.speed.vertical
	}

	update = () => {
		const now = performance.now()
		if (this.threeControls.isLocked) {
			const delta = (now - this.prevTime) / 1000

			// Extract movement info for later convenience
			const {
				moveUp,
				moveDown,
				moveLeft,
				moveRight,
				moveForward,
				moveBackward
			} = this.movements

			// Update velocity with inertia
			this.velocity.x -= this.velocity.x * this.INERTIA * delta
			this.velocity.y -= this.velocity.y * this.INERTIA * delta
			this.velocity.z -= this.velocity.z * this.INERTIA * delta

			// Update direction with movements
			this.direction.x = Number(moveLeft) - Number(moveRight)
			this.direction.y = Number(moveDown) - Number(moveUp)
			this.direction.z = Number(moveForward) - Number(moveBackward)
			this.direction.normalize() // this ensures consistent movements in all directions

			// Update velocity again according to direction
			if (moveForward || moveBackward)
				this.velocity.z -= this.direction.z * this.HORIZONTAL_SPEED * delta
			if (moveLeft || moveRight)
				this.velocity.x -= this.direction.x * this.HORIZONTAL_SPEED * delta
			if (moveUp || moveDown)
				this.velocity.y -= this.direction.y * this.VERTICAL_SPEED * delta

			// Translation of player
			const object = this.getObject()
			object.translateX(this.velocity.x * delta)
			object.translateY(this.velocity.y * delta)
			object.translateZ(this.velocity.z * delta)
		}
		this.prevTime = now
	}

	getObject = () => this.threeControls.getObject()
	getCoordinates = () => {
		const position = this.threeControls.getObject().position.clone()
		position.x /= Config.block.dimension
		position.y /= Config.block.dimension
		position.z /= Config.block.dimension
		position.x =
			Math.round(position.x * Math.pow(10, Config.player.coordinateDec)) /
			Math.pow(10, Config.player.coordinateDec)
		position.y =
			Math.round(position.y * Math.pow(10, Config.player.coordinateDec)) /
			Math.pow(10, Config.player.coordinateDec)
		position.z =
			Math.round(position.z * Math.pow(10, Config.player.coordinateDec)) /
			Math.pow(10, Config.player.coordinateDec)
		return position
	}
	getDirections = () => {
		return {
			dirx: Helpers.round(
				this.threeControls.getPitch().rotation.x,
				Config.player.coordinateDec
			),
			diry: Helpers.round(
				this.threeControls.getObject().rotation.y,
				Config.player.coordinateDec
			)
		}
	}

	// Private Methods
	_initListeners = () => {
		this.blocker.addEventListener(
			'click',
			() => {
				this.threeControls.lock()
			},
			false
		)

		this.threeControls.addEventListener('lock', () => {
			this.blocker.style.display = 'none'
		})

		this.threeControls.addEventListener('unlock', () => {
			this.blocker.style.display = 'block'
		})

		let onKeyDown = event => {
			if (event.shiftKey) this.movements.moveDown = true

			switch (event.keyCode) {
				case 38: // up
				case 87: // w
					this.movements.moveForward = true
					break

				case 37: // left
				case 65: // a
					this.movements.moveLeft = true
					break

				case 40: // down
				case 83: // s
					this.movements.moveBackward = true
					break

				case 39: // right
				case 68: // d
					this.movements.moveRight = true
					break

				case 32: // space
					this.movements.moveUp = true
					break
				default:
					break
			}
		}

		let onKeyUp = event => {
			switch (event.keyCode) {
				case 38: // up
				case 87: // w
					this.movements.moveForward = false
					break

				case 37: // left
				case 65: // a
					this.movements.moveLeft = false
					break

				case 40: // down
				case 83: // s
					this.movements.moveBackward = false
					break

				case 39: // right
				case 68: // d
					this.movements.moveRight = false
					break
				case 32: // space
					this.movements.moveUp = false
					break
				case 16: // shift
					this.movements.moveDown = false
					break
				default:
					break
			}
		}

		document.addEventListener('keydown', onKeyDown, false)
		document.addEventListener('keyup', onKeyUp, false)
	}
}
