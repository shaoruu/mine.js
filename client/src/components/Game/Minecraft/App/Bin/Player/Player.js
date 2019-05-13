import * as THREE from 'three'
import raycast from 'fast-voxel-raycast'

import PointerLockControls from '../../../Utils/PointerLockControls'
import Config from '../../../Data/Config'
import Helpers from '../../../Utils/Helpers'
import Inventory from './Inventory/Inventory'
import Chat from '../Chat/Chat'

const size = Config.chunk.size,
  dimension = Config.block.dimension,
  reachDst = Config.player.reachDst,
  inertia = Config.player.inertia,
  horz_speed = Config.player.speed.horizontal,
  vert_speed = Config.player.speed.vertical,
  coordinateDec = Config.player.coordinateDec,
  horz_max_speed = Config.player.maxSpeed.horizontal,
  vert_max_speed = Config.player.maxSpeed.vertical

export default class Player {
  constructor(
    id,
    camera,
    scene,
    world,
    container,
    blocker,
    initPos,
    initDirs,
    resourceManager,
    inventory,
    mutatePlayer
  ) {
    this.id = id

    this.mutatePlayer = mutatePlayer

    this.prevTime = performance.now()

    this.velocity = new THREE.Vector3()
    this.direction = new THREE.Vector3()

    // Chat
    this.chat = new Chat(container)

    /** CONNECTIONS TO OUTER SPACE */
    this.scene = scene
    this.camera = camera
    this.world = world

    // Orbit controls first needs to pass in THREE to constructor
    this.threeControls = new PointerLockControls(
      camera,
      container,
      initPos,
      initDirs
    )

    this.chat.addControlListener(this.threeControls)

    this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      down: false,
      up: false
    }

    this.mouseKey = null

    this.blocker = blocker

    const { cursor, data } = inventory
    this.inventory = new Inventory(
      container,
      resourceManager,
      cursor,
      data,
      this.mutateSelf
    )

    // Centered to middle of screen
    this.fakeMouse = new THREE.Vector2(0.0, 0.0)

    const box = new THREE.BoxGeometry(
      dimension + 0.1,
      dimension + 0.1,
      dimension + 0.1
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

    // Setting up raycasting for block tracing and collisions
    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = reachDst * dimension

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

    let delta = (now - this.prevTime) / 1000

    if (delta > 0.5) delta = 0.01

    // Extract movement info for later convenience
    const { up, down, left, right, forward, backward } = this.movements

    if (typeof this.mouseKey === 'number') {
      switch (this.mouseKey) {
        case 0: // Left Key
          this.world.breakBlock()
          break
        case 2: // Right Key
          const type = this.inventory.getHand()
          if (type) this.world.placeBlock(type)
          break
        default:
          break
      }
    }

    // Update velocity with inertia
    this.velocity.x -= this.velocity.x * this.INERTIA * delta
    this.velocity.y -= this.velocity.y * this.INERTIA * delta
    this.velocity.z -= this.velocity.z * this.INERTIA * delta

    // Update direction with movements
    this.direction.x = Number(left) - Number(right)
    this.direction.y = Number(down) - Number(up)
    this.direction.z = Number(forward) - Number(backward)
    this.direction.normalize() // this ensures consistent movements in all directions

    // Update velocity again according to direction
    if (forward || backward)
      this.velocity.z -= this.direction.z * this.HORIZONTAL_SPEED * delta
    if (left || right)
      this.velocity.x -= this.direction.x * this.HORIZONTAL_SPEED * delta
    if (up || down)
      this.velocity.y -= this.direction.y * this.VERTICAL_SPEED * delta

    if (this.velocity.x > horz_max_speed) this.velocity.x = horz_max_speed
    else if (this.velocity.x < -horz_max_speed)
      this.velocity.x = -horz_max_speed
    if (this.velocity.y > vert_max_speed) this.velocity.y = vert_max_speed
    else if (this.velocity.y < -vert_max_speed)
      this.velocity.y = -vert_max_speed
    if (this.velocity.z > horz_max_speed) this.velocity.z = horz_max_speed
    else if (this.velocity.z < -horz_max_speed)
      this.velocity.z = -horz_max_speed

    // Translation of player
    const object = this.threeControls.getObject()
    object.translateX(this.velocity.x * delta)
    object.translateY(this.velocity.y * delta)
    object.translateZ(this.velocity.z * delta)

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
    const object = this.threeControls.getObject()

    const camDir = new THREE.Vector3()
    this.camera.getWorldDirection(camDir)
    camDir.normalize()

    const camPos = object.position

    const point = [],
      normal = []
    const result = raycast(
      this.world.getVoxelByCoords,
      [camPos.x, camPos.y, camPos.z],
      [camDir.x, camDir.y, camDir.z],
      reachDst * dimension,
      point,
      normal
    )

    if (!result) return null

    // Global Block Coords
    const gbc = Helpers.toGlobalBlock(
      { x: point[0], y: point[1], z: point[2] },
      true
    )

    // Chunk Coords and Block Coords
    const { coordx: cx, coordy: cy, coordz: cz } = Helpers.toChunkCoords(gbc),
      bc = Helpers.toBlockCoords(gbc)

    const chunkDim = size * dimension

    // Target for wireframe
    let targetwf = {
      x: cx * chunkDim + bc.x * dimension,
      y: cy * chunkDim + bc.y * dimension,
      z: cz * chunkDim + bc.z * dimension
    }

    let target = {
      chunk: { cx, cy, cz },
      block: { ...bc },
      neighbors: []
    }

    let potential = {
      chunk: { cx, cy, cz },
      block: { ...bc }
    }

    /*eslint eqeqeq: "off"*/
    let axis, chunkxis
    if (Math.abs(normal[0]).toFixed(1) == 1) {
      axis = 'x'
      chunkxis = 'cx'
      if (normal[0] >= 1) {
        // y-z plane
        targetwf.x = cx * chunkDim + (bc.x - 1) * dimension
        target.block.x -= 1
      } else potential.block.x -= 1
    } else if (Math.abs(normal[1]).toFixed(1) == 1) {
      axis = 'y'
      chunkxis = 'cy'
      if (normal[1] >= 1) {
        // x-z plane
        targetwf.y = cy * chunkDim + (bc.y - 1) * dimension
        target.block.y -= 1
      } else potential.block.y -= 1
    } else if (Math.abs(normal[2]).toFixed(1) == 1) {
      axis = 'z'
      chunkxis = 'cz'
      if (normal[2] >= 1) {
        // x-y plane
        targetwf.z = cz * chunkDim + (bc.z - 1) * dimension
        target.block.z -= 1
      } else potential.block.z -= 1
    }

    /** adjusting target and potential to correct chunks */
    if (target.block[axis] < 0) {
      target.block[axis] = size - 1
      target.chunk[chunkxis] -= 1
    } else if (target.block[axis] > size - 1) {
      target.block[axis] = 0
      target.chunk[chunkxis] += 1
    }

    if (potential.block[axis] < 0) {
      potential.block[axis] = size - 1
      potential.chunk[chunkxis] -= 1
    } else if (potential.block[axis] > size - 1) {
      potential.block[axis] = 0
      potential.chunk[chunkxis] += 1
    }

    targetwf.x -= 0.05
    targetwf.y -= 0.05
    targetwf.z -= 0.05

    return { target, targetwf, potential }
  }
  getObject = () => this.threeControls.getObject()
  getCoordinates = () => {
    const position = this.threeControls.getObject().position.clone()

    return Helpers.roundPos(Helpers.toGlobalBlock(position), coordinateDec)
  }
  getDirections = () => {
    return {
      dirx: Helpers.round(
        this.threeControls.getPitch().rotation.x,
        coordinateDec
      ),
      diry: Helpers.round(
        this.threeControls.getObject().rotation.y,
        coordinateDec
      )
    }
  }

  mutateSelf = obj => {
    this.mutatePlayer({
      variables: {
        id: this.id,
        ...obj
      }
    })
  }

  // Add item to inventory
  obtain = (type, count) => {
    // TODO: implement if inventory is full

    this.inventory.add(type, count)
  }
  // Remove item from hand
  takeFromHand = amount => {
    this.inventory.takeFromHand(amount)
  }

  // Private Methods
  _initListeners = () => {
    this.blocker.addEventListener(
      'click',
      () => {
        this.blocker.style.display = 'none'
        this.threeControls.lock()
      },
      false
    )

    this.threeControls.addEventListener('unlock', () => {
      this._resetMovements()
      if (!this.chat.enabled) {
        this.blocker.style.display = 'block'
      }
    })

    const onKeyDown = event => {
      // TODO: Convert this to a switch statement for game state
      if (this.chat.enabled) {
        switch (event.keyCode) {
          case 13: // enter
            this.chat.handleEnter()
            break

          case 40: // down
            break

          case 38: // up
            break

          case 37: // left
            if (this.chat.enabled) this.chat.input.left()
            break

          case 39: // right
            if (this.chat.enabled) this.chat.input.right()
            break

          default:
            if (this.chat.enabled) {
              const char = String.fromCharCode(event.keyCode)
              this.chat.input.insert(char)
            }
            break
        }
      } else {
        if (!this.threeControls.isLocked) return

        switch (event.keyCode) {
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57: // number keys
            const index = event.keyCode - 49
            if (this.inventory.getCursor() !== index) {
              this.mutateSelf({ cursor: index })
              this.inventory.switchHotbar(index)
            }
            break

          case 87: // w
            this.movements.forward = true
            break

          case 65: // a
            this.movements.left = true
            break

          case 83: // s
            this.movements.backward = true
            break

          case 68: // d
            this.movements.right = true
            break

          case 32: // space
            this.movements.up = true
            break

          case 16: // shift
            this.movements.down = true
            break

          case 84: // T
            this.chat.enable()
            this.threeControls.unlock()
            break

          default:
            break
        }
      }
    }

    const onKeyUp = event => {
      switch (event.keyCode) {
        case 87: // w
          this.movements.forward = false
          break

        case 65: // a
          this.movements.left = false
          break

        case 83: // s
          this.movements.backward = false
          break

        case 68: // d
          this.movements.right = false
          break

        case 32: // space
          this.movements.up = false
          break

        case 16: // shift
          this.movements.down = false
          break

        case 27: // esc
          // TODO: Fix bug in firefox
          if (this.chat.enabled) {
            this.chat.disable()
            if (!this.threeControls.isLocked) this.threeControls.lock()
          } else this.blocker.style.display = 'block'
          break

        default:
          break
      }
    }

    const onMouseDown = e => {
      if (!this.chat.enabled && this.threeControls.isLocked)
        this.mouseKey = e.button
    }
    const onMouseUp = () => (this.mouseKey = null)

    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)
    document.addEventListener('mousedown', onMouseDown, false)
    document.addEventListener('mouseup', onMouseUp, false)
  }
  _resetMovements = () =>
    (this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      down: false,
      up: false
    })
}
