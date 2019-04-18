import * as THREE from 'three'

import PointerLockControls from '../../../Utils/PointerLockControls'
import Config from '../../../Data/Config'
import Helpers from '../../../Utils/Helpers'

const size = Config.chunk.size,
	dimension = Config.block.dimension,
	fetchDst = Config.player.fetchDst,
	inertia = Config.player.inertia,
	horz_speed = Config.player.speed.horizontal,
	vert_speed = Config.player.speed.vertical,
	coordinateDec = Config.player.coordinateDec

// Controls based on orbit controls
export default class Controls {
	constructor(camera, scene, world, container, blocker, initPos, initDirs) {
		// Orbit controls first needs to pass in THREE to constructor
		this.threeControls = new PointerLockControls(camera, container, initPos, initDirs)

		this.prevTime = performance.now()

		this.velocity = new THREE.Vector3()
		this.direction = new THREE.Vector3()

		/** CONNECTIONS TO OUTER SPACE */
		this.scene = scene
		this.camera = camera
		this.world = world

		this.movements = {
			moveForward: false,
			moveBackward: false,
			moveLeft: false,
			moveRight: false,
			moveDown: false,
			moveUp: false
		}

		this.mousePressed = false

		this.blocker = blocker

		// Centered to middle of screen
		this.fakeMouse = new THREE.Vector2(0, 0)

		const box = new THREE.BoxGeometry(
			dimension + 0.24,
			dimension + 0.24,
			dimension + 0.24
		)
		const wireframe = new THREE.WireframeGeometry(box)
		this.highlighter = new THREE.LineSegments(wireframe)

		this.boxhelper = new THREE.BoxHelper(this.highlighter, 0x070707)
		this.boxhelper.name = 'wireframe'

		this.init(scene)
	}

	init(scene) {
		this._initListeners()
		scene.add(this.getObject())

		// Setting up raycasting
		this.raycaster = new THREE.Raycaster()
		this.raycaster.far = fetchDst * dimension

		// CONSTANTS
		this.INERTIA = inertia
		this.HORIZONTAL_SPEED = horz_speed
		this.VERTICAL_SPEED = vert_speed

		// Adding wireframe
		this.scene.add(this.boxhelper)
		this.isWireframed = true
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

			if (this.mousePressed) this.world.breakBlock()

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

		/** Updating targetted block */
		const blockInfo = this.getLookingBlockInfo()
		if (blockInfo) {
			const { target, targetwf, potential } = blockInfo

			// Signal to world
			this.world.setTarget(target)
			this.world.setPotential(potential)

			const { x, y, z } = targetwf

			if (
				x !== this.highlighter.position.x ||
				y !== this.highlighter.position.y ||
				z !== this.highlighter.position.z
			) {
				this.highlighter.position.x = x
				this.highlighter.position.y = y
				this.highlighter.position.z = z
			}

			this.boxhelper.setFromObject(this.highlighter)
			if (!this.isWireframed) this.scene.add(this.boxhelper)
		} else {
			const obj = this.scene.getObjectByName('wireframe')

			// Clearing world potentials
			this.world.setTarget(null)
			this.world.setPotential(null)

			if (obj) {
				this.scene.remove(obj)
				this.isWireframed = false
			}
		}

		this.prevTime = now
	}

	getLookingBlockInfo = () => {
		this.raycaster.setFromCamera(this.fakeMouse, this.camera)

		// Getting chunk position
		const { coordx, coordy, coordz } = Helpers.toChunkCoords(this.getCoordinates())

		const chunks = [
			[coordx, coordy, coordz],
			[coordx - 1, coordy, coordz],
			[coordx + 1, coordy, coordz],
			[coordx, coordy - 1, coordz],
			[coordx, coordy + 1, coordz],
			[coordx, coordy, coordz - 1],
			[coordx, coordy, coordz + 1]
		]
			.map(coords => this.world.getChunkByCoords(coords[0], coords[1], coords[2]))
			.filter(c => c)
			.map(c => c.getMesh())
			.filter(m => m)

		if (!chunks.length) return null

		const objs = this.raycaster.intersectObjects(chunks)
		if (objs.length === 0) return null

		const {
			point,
			face: { normal }
		} = objs[0]

		// Global Block Coords
		const gbc = Helpers.toGlobalBlock(point, true)

		// Chunk Coords and Block Coords
		const { coordx: cx, coordy: cy, coordz: cz } = Helpers.toChunkCoords(gbc),
			pChunk = this.world.getChunkByCoords(cx, cy, cz),
			bc = Helpers.toBlockCoords(gbc)

		const chunkDim = size * dimension

		// Target for wireframe
		let targetwf = {
			x: cx * chunkDim + bc.x * dimension + dimension / 2,
			y: cy * chunkDim + bc.y * dimension + dimension / 2,
			z: cz * chunkDim + bc.z * dimension + dimension / 2
		}

		let target = {
			chunk: { cx, cy, cz },
			block: { ...bc }
		}

		let potential = {
			chunk: { cx, cy, cz },
			block: { ...bc }
		}

		/*eslint eqeqeq: ["off"]*/
		if (Math.abs(normal.x).toFixed(1) == 1)
			if (Boolean(pChunk.getBlock(bc.x - 1, bc.y, bc.z))) {
				// y-z plane
				targetwf.x = cx * chunkDim + (bc.x - 1) * dimension + dimension / 2
				target.block.x -= 1
			} else potential.block.x -= 1
		else if (Math.abs(normal.y).toFixed(1) == 1)
			if (Boolean(pChunk.getBlock(bc.x, bc.y - 1, bc.z))) {
				// x-z plane
				targetwf.y = cy * chunkDim + (bc.y - 1) * dimension + dimension / 2
				target.block.y -= 1
			} else potential.block.y -= 1
		else if (Math.abs(normal.z).toFixed(1) == 1)
			if (Boolean(pChunk.getBlock(bc.x, bc.y, bc.z - 1))) {
				// x-y plane
				targetwf.z = cz * chunkDim + (bc.z - 1) * dimension + dimension / 2
				target.block.z -= 1
			} else potential.block.z -= 1

		targetwf.x -= 0.12
		targetwf.y -= 0.12
		targetwf.z -= 0.12

		return { target, targetwf, potential }
	}
	getObject = () => this.threeControls.getObject()
	getCoordinates = () => {
		const position = this.threeControls.getObject().position.clone()

		return Helpers.roundPos(Helpers.toGlobalBlock(position), coordinateDec)
	}
	getDirections = () => {
		return {
			dirx: Helpers.round(this.threeControls.getPitch().rotation.x, coordinateDec),
			diry: Helpers.round(this.threeControls.getObject().rotation.y, coordinateDec)
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

		const onKeyDown = event => {
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

		const onKeyUp = event => {
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

		const onMouseDown = () => (this.mousePressed = true)
		const onMouseUp = () => (this.mousePressed = false)

		document.addEventListener('keydown', onKeyDown, false)
		document.addEventListener('keyup', onKeyUp, false)
		document.addEventListener('mousedown', onMouseDown, false)
		document.addEventListener('mouseup', onMouseUp, false)
	}
}
