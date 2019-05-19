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
  pWidth = Config.player.aabb.width,
  pHeight = Config.player.aabb.height,
  pDepth = Config.player.aabb.depth,
  coordinateDec = Config.player.coordinateDec,
  horz_max_speed = Config.player.maxSpeed.horizontal,
  vert_max_speed = Config.player.maxSpeed.vertical,
  INERTIA = Config.player.inertia,
  HORIZONTAL_ACC = Config.player.acceleration.horizontal,
  VERITCAL_ACC = Config.player.acceleration.vertical

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
    this.acceleration = new THREE.Vector3()

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

    // Adding wireframe
    this.scene.add(this.boxhelper)
    this.isWireframed = true

    // TEMPS
    this.restrained = { x: null, y: null, z: null }
  }

  update = () => {
    this.handleKeyInputs()

    this.handleMovements()

    this.updateTPBlocks()
  }

  handleKeyInputs = () => {
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
      this.mouseKey = null
    }
  }

  handleMovements = () => {
    const object = this.threeControls.getObject()
    const now = performance.now()

    let delta = (now - this.prevTime) / 1000

    if (delta > 0.5) delta = 0.01

    this.calculateAccelerations()

    // Update velocity with inertia
    this.velocity.x -= this.velocity.x * INERTIA * delta
    this.velocity.y -= this.velocity.y * INERTIA * delta
    this.velocity.z -= this.velocity.z * INERTIA * delta

    this.velocity.add(this.acceleration)
    this.acceleration.set(0.0, 0.0, 0.0)

    if (this.velocity.x > horz_max_speed) this.velocity.x = horz_max_speed
    else if (this.velocity.x < -horz_max_speed)
      this.velocity.x = -horz_max_speed
    if (this.velocity.y > vert_max_speed) this.velocity.y = vert_max_speed
    else if (this.velocity.y < -vert_max_speed)
      this.velocity.y = -vert_max_speed
    if (this.velocity.z > horz_max_speed) this.velocity.z = horz_max_speed
    else if (this.velocity.z < -horz_max_speed)
      this.velocity.z = -horz_max_speed

    // AABB
    const playerPos = (() => {
      const temp = this.getCoordinates(10)
      temp.x -= pWidth / 2
      temp.y -= pHeight
      temp.z -= pDepth / 2
      return temp
    })()
    const scaledVel = this.velocity.clone().multiplyScalar(delta / dimension)

    const EPSILON = 1 / 1024

    // X-AXIS COLLISION
    if (scaledVel.x !== 0) {
      const min_x = playerPos.x
      const max_x = playerPos.x + pWidth
      const min_y = Math.round(playerPos.y)
      const max_y = Math.round(playerPos.y + pHeight)
      const min_z = Math.round(playerPos.z)
      const max_z = Math.round(playerPos.z + pDepth)

      let start_x, end_x
      if (scaledVel.x > 0) {
        // console.log('posx')
        start_x = max_x
        end_x = max_x + scaledVel.x

        for (let pos_x = start_x; pos_x <= end_x; pos_x++) {
          let voxelExists = false
          for (let y = min_y; y <= max_y; y++) {
            if (voxelExists) break
            for (let z = min_z; z <= max_z; z++)
              if (
                this.world.getVoxelByVoxelCoords(
                  Math.round(pos_x),
                  Math.round(y),
                  Math.round(z)
                )
              ) {
                voxelExists = true
                console.log('x')
                break
              }
          }

          if (voxelExists) {
            playerPos.x = Math.floor(pos_x) - EPSILON
            console.log(playerPos.x)
            scaledVel.x = 0
            break
          }
        }
      } else {
        start_x = min_x
        end_x = min_x - scaledVel.x

        for (let pos_x = start_x; pos_x <= end_x; pos_x++) {
          let voxelExists = false
          for (let y = min_y; y <= max_y; y++) {
            if (voxelExists) break
            for (let z = min_z; z <= max_z; z++)
              if (this.world.getVoxelByVoxelCoords(pos_x | 0, y | 0, z | 0)) {
                voxelExists = true
                console.log('x')
                break
              }
          }

          if (voxelExists) {
            playerPos.x = Math.floor(pos_x) + pWidth + EPSILON
            console.log(playerPos.x)
            scaledVel.x = 0
            break
          }
        }
      }
    }

    // Z-AXIS COLLISION
    if (scaledVel.x !== 0 && scaledVel.z !== 0) {
      const min_x = Math.round(playerPos.x)
      const max_x = Math.round(playerPos.x + pWidth)
      const min_y = Math.round(playerPos.y)
      const max_y = Math.round(playerPos.y + pHeight)
      const min_z = playerPos.z
      const max_z = playerPos.z + pDepth

      let start_z, end_z
      if (scaledVel.z > 0) {
        // console.log('posx')
        start_z = max_z
        end_z = max_z + scaledVel.z

        for (let pos_z = start_z; pos_z <= end_z; pos_z++) {
          let voxelExists = false
          for (let x = min_x; x <= max_x; x++) {
            if (voxelExists) break
            for (let y = min_y; y <= max_y; y++)
              if (
                this.world.getVoxelByVoxelCoords(
                  Math.round(x),
                  Math.round(y),
                  Math.round(pos_z)
                )
              ) {
                voxelExists = true
                console.log('z')
                break
              }
          }

          if (voxelExists) {
            playerPos.z = Math.floor(pos_z) - EPSILON
            console.log(playerPos.z)
            scaledVel.z = 0
            break
          }
        }
      } else {
        start_z = min_z + scaledVel.z
        end_z = min_z

        for (let pos_z = start_z; pos_z <= end_z; pos_z++) {
          let voxelExists = false
          for (let x = min_x; x <= max_x; x++) {
            if (voxelExists) break
            for (let y = min_y; y <= max_y; y++)
              if (this.world.getVoxelByVoxelCoords(x | 0, y | 0, pos_z | 0)) {
                voxelExists = true
                console.log('z')
                break
              }
          }

          if (voxelExists) {
            playerPos.z = Math.floor(pos_z) + pDepth + EPSILON
            console.log(playerPos.z)
            scaledVel.z = 0
            break
          }
        }
      }
    }

    playerPos.z += scaledVel.z
    playerPos.x += scaledVel.x

    scaledVel.multiplyScalar(dimension / delta)
    this.velocity.copy(scaledVel)

    const position = object.position
    position.set(
      playerPos.x + pWidth / 2,
      playerPos.y + pHeight,
      playerPos.z + pDepth / 2
    )
    position.multiplyScalar(dimension)
    // object.translateX(scaledVel.x)
    // object.translateY(scaledVel.y)
    // object.translateZ(scaledVel.z)

    this.prevTime = now
  }

  updateTPBlocks = () => {
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
  }

  calculateAccelerations = () => {
    const { diry } = this.getDirections()

    // Extract movement info for later convenience
    const { up, down, left, right, forward, backward } = this.movements

    if (up)
      // TODO: add fly/land mode here
      this.acceleration.y += VERITCAL_ACC
    else if (down) this.acceleration.y -= VERITCAL_ACC

    if (left) {
      this.acceleration.x += -Math.sin(diry + Math.PI / 2) * HORIZONTAL_ACC
      this.acceleration.z += -Math.cos(diry + Math.PI / 2) * HORIZONTAL_ACC
    }

    if (right) {
      this.acceleration.x += Math.sin(diry + Math.PI / 2) * HORIZONTAL_ACC
      this.acceleration.z += Math.cos(diry + Math.PI / 2) * HORIZONTAL_ACC
    }

    if (forward) {
      // TODO: implement sprint here.
      this.acceleration.x += -Math.sin(diry) * HORIZONTAL_ACC
      this.acceleration.z += -Math.cos(diry) * HORIZONTAL_ACC
    }

    if (backward) {
      this.acceleration.x += Math.sin(diry) * HORIZONTAL_ACC
      this.acceleration.z += Math.cos(diry) * HORIZONTAL_ACC
    }
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
      this.world.getVoxelByWorldCoords,
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
  getCoordinates = (dec = coordinateDec) => {
    const position = this.threeControls.getObject().position.clone()

    return Helpers.roundPos(Helpers.toGlobalBlock(position), dec)
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

    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)
    document.addEventListener('mousedown', onMouseDown, false)
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
