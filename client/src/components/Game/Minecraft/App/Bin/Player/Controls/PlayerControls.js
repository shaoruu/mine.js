import * as THREE from 'three'

import PointerLockControls from './PointerLockControls'
import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'

const HORZ_MAX_SPEED = Config.player.maxSpeed.horizontal,
  VERT_MAX_SPEED = Config.player.maxSpeed.vertical,
  INERTIA = Config.player.inertia,
  HORIZONTAL_ACC = Config.player.acceleration.horizontal,
  VERITCAL_ACC = Config.player.acceleration.vertical,
  COORD_DEC = Config.player.coordinateDec,
  DIMENSION = Config.block.dimension,
  P_WIDTH = Config.player.aabb.width,
  P_DEPTH = Config.player.aabb.depth,
  P_I_2_TOE = Config.player.aabb.eye2toe,
  P_I_2_TOP = Config.player.aabb.eye2top

class PlayerControls {
  constructor(
    player,
    world,
    chat,
    camera,
    container,
    blocker,
    initPos,
    initDirs
  ) {
    // Controls
    this.threeControls = new PointerLockControls(
      camera,
      container,
      initPos,
      initDirs
    )

    // Physics
    this.vel = new THREE.Vector3(0, 0, 0)
    this.acc = new THREE.Vector3(0, 0, 0)

    this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      down: false,
      up: false
    }

    // Keyboard & mouse
    this.mouseKey = null

    // Connections to outer space
    this.player = player
    this.world = world
    this.chat = chat
    this.blocker = blocker

    // Others
    this.prevTime = performance.now()

    this.initListeners()
  }

  initListeners = () => {
    this.blocker.addEventListener(
      'click',
      () => {
        this.blocker.style.display = 'none'
        this.threeControls.lock()
      },
      false
    )

    this.threeControls.addEventListener(
      'unlock',
      () => {
        this._resetMovements()
        if (!this.chat.enabled) {
          this.blocker.style.display = 'block'
        }
      },
      false
    )

    document.addEventListener('keydown', this._handleKeyDown, false)
    document.addEventListener('keyup', this._handleKeyUp, false)
    document.addEventListener('mousedown', this._handleMouseDown, false)
  }

  tick = () => {
    this._handleMouseInputs()
    this._handleMovements()
  }

  /**
   * Getters
   */
  getDirections = () => {
    return {
      dirx: Helpers.round(this.threeControls.getPitch().rotation.x, COORD_DEC),
      diry: Helpers.round(this.threeControls.getObject().rotation.y, COORD_DEC)
    }
  }
  getObject = () => this.threeControls.getObject()
  getNormalizedCamPos = (dec = COORD_DEC) => {
    // Normalized as in normalized to world coordinates
    const position = this.getObject().position.clone()
    return Helpers.roundPos(Helpers.toGlobalBlock(position, false), dec)
  }

  /**
   * INTERNAL FUNCTIONS
   */
  _resetMovements = () =>
    (this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      down: false,
      up: false
    })
  _handleMouseInputs = () => {
    if (typeof this.mouseKey === 'number') {
      switch (this.mouseKey) {
        case 0: // Left Key
          this.world.breakBlock()
          break
        case 2: // Right Key
          const type = this.player.inventory.getHand()
          if (type) this.world.placeBlock(type)
          break
        default:
          break
      }
      this.mouseKey = null
    }
  }
  _handleMovements = () => {
    const now = performance.now()

    let delta = (now - this.prevTime) / 1000

    if (delta > 0.5) delta = 0.01

    this._calculateAccelerations()

    // Update velocity with inertia
    this.vel.x -= this.vel.x * INERTIA * delta
    this.vel.y -= this.vel.y * INERTIA * delta
    this.vel.z -= this.vel.z * INERTIA * delta

    this.vel.add(this.acc)
    this.acc.set(0.0, 0.0, 0.0)

    if (this.vel.x > HORZ_MAX_SPEED) this.vel.x = HORZ_MAX_SPEED
    else if (this.vel.x < -HORZ_MAX_SPEED) this.vel.x = -HORZ_MAX_SPEED
    if (this.vel.y > VERT_MAX_SPEED) this.vel.y = VERT_MAX_SPEED
    else if (this.vel.y < -VERT_MAX_SPEED) this.vel.y = -VERT_MAX_SPEED
    if (this.vel.z > HORZ_MAX_SPEED) this.vel.z = HORZ_MAX_SPEED
    else if (this.vel.z < -HORZ_MAX_SPEED) this.vel.z = -HORZ_MAX_SPEED

    this._handleCollisions(delta)

    this.prevTime = now
  }
  _calculateAccelerations = () => {
    const { diry } = this.getDirections()

    // Extract movement info for later convenience
    const { up, down, left, right, forward, backward } = this.movements

    if (up)
      // TODO: add fly/land mode here
      this.acc.y += VERITCAL_ACC
    else if (down) this.acc.y -= VERITCAL_ACC

    if (left) {
      this.acc.x += -Math.sin(diry + Math.PI / 2) * HORIZONTAL_ACC
      this.acc.z += -Math.cos(diry + Math.PI / 2) * HORIZONTAL_ACC
    }

    if (right) {
      this.acc.x += Math.sin(diry + Math.PI / 2) * HORIZONTAL_ACC
      this.acc.z += Math.cos(diry + Math.PI / 2) * HORIZONTAL_ACC
    }

    if (forward) {
      // TODO: implement sprint here.
      this.acc.x += -Math.sin(diry) * HORIZONTAL_ACC
      this.acc.z += -Math.cos(diry) * HORIZONTAL_ACC
    }

    if (backward) {
      this.acc.x += Math.sin(diry) * HORIZONTAL_ACC
      this.acc.z += Math.cos(diry) * HORIZONTAL_ACC
    }
  }
  _handleCollisions = delta => {
    // AABB
    const playerPos = this.getNormalizedCamPos(10)
    const scaledVel = this.vel.clone().multiplyScalar(delta / DIMENSION)

    const EPSILON = 1 / 1024

    let newX, newY, newZ

    // X-AXIS COLLISION
    if (!Helpers.approxEquals(scaledVel.x, 0)) {
      const min_x = playerPos.x - P_WIDTH / 2
      const max_x = playerPos.x + P_WIDTH / 2
      const min_y = Math.floor(playerPos.y - P_I_2_TOE)
      const max_y = Math.floor(playerPos.y + P_I_2_TOP)
      const min_z = Math.floor(playerPos.z - P_DEPTH / 2)
      const max_z = Math.floor(playerPos.z + P_DEPTH / 2)

      const isPos = scaledVel.x > 0

      let start_x, end_x
      if (scaledVel.x > 0) {
        start_x = max_x
        end_x = max_x + scaledVel.x
      } else {
        start_x = min_x + scaledVel.x
        end_x = min_x
      }

      for (
        let pos_x = isPos ? end_x : start_x;
        isPos ? pos_x >= start_x : pos_x <= end_x;
        isPos ? pos_x-- : pos_x++
      ) {
        let voxelExists = false
        for (let y = min_y; y <= max_y; y++) {
          if (voxelExists) break
          for (let z = min_z; z <= max_z; z++)
            if (this.world.getVoxelByVoxelCoords(Math.floor(pos_x), y, z)) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.x > 0) newX = Math.floor(pos_x) - P_WIDTH / 2 - EPSILON
          else newX = Math.floor(pos_x) + P_WIDTH / 2 + 1 + EPSILON
          // console.log(playerPos.x)
          scaledVel.x = 0
          break
        }
      }
    }

    // Y-AXIS COLLISION
    if (!Helpers.approxEquals(scaledVel.y, 0)) {
      const min_y = playerPos.y - P_I_2_TOE
      const max_y = playerPos.y + P_I_2_TOP
      const min_x = Math.floor(playerPos.x - P_WIDTH / 2)
      const max_x = Math.floor(playerPos.x + P_WIDTH / 2)
      const min_z = Math.floor(playerPos.z - P_DEPTH / 2)
      const max_z = Math.floor(playerPos.z + P_DEPTH / 2)

      const isPos = scaledVel.y > 0

      let start_y, end_y
      if (scaledVel.y > 0) {
        start_y = max_y
        end_y = max_y + scaledVel.y
      } else {
        start_y = min_y + scaledVel.y
        end_y = min_y
      }

      for (
        let pos_y = isPos ? end_y : start_y;
        isPos ? pos_y >= start_y : pos_y <= end_y;
        isPos ? pos_y-- : pos_y++
      ) {
        let voxelExists = false
        for (let x = min_x; x <= max_x; x++) {
          if (voxelExists) break
          for (let z = min_z; z <= max_z; z++)
            if (this.world.getVoxelByVoxelCoords(x, Math.floor(pos_y), z)) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.y > 0) newY = Math.floor(pos_y) - P_I_2_TOP - EPSILON
          else newY = Math.floor(pos_y) + 1 + P_I_2_TOE + EPSILON

          scaledVel.y = 0
          break
        }
      }
    }

    // Z-AXIS COLLISION
    if (!Helpers.approxEquals(scaledVel.z, 0)) {
      const min_z = playerPos.z - P_DEPTH / 2
      const max_z = playerPos.z + P_DEPTH / 2
      const min_x = Math.floor(playerPos.x - P_WIDTH / 2)
      const max_x = Math.floor(playerPos.x + P_WIDTH / 2)
      const min_y = Math.floor(playerPos.y - P_I_2_TOE)
      const max_y = Math.floor(playerPos.y + P_I_2_TOP)

      const isPos = scaledVel.z > 0

      let start_z, end_z
      if (scaledVel.z > 0) {
        start_z = max_z
        end_z = max_z + scaledVel.z
      } else {
        start_z = min_z + scaledVel.z
        end_z = min_z
      }

      for (
        let pos_z = isPos ? end_z : start_z;
        isPos ? pos_z >= start_z : pos_z <= end_z;
        isPos ? pos_z-- : pos_z++
      ) {
        let voxelExists = false
        for (let x = min_x; x <= max_x; x++) {
          if (voxelExists) break
          for (let y = min_y; y <= max_y; y++)
            if (this.world.getVoxelByVoxelCoords(x, y, Math.floor(pos_z))) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.z > 0) newZ = Math.floor(pos_z) - P_DEPTH / 2 - EPSILON
          else newZ = Math.floor(pos_z) + P_DEPTH / 2 + 1 + EPSILON
          scaledVel.z = 0
          break
        }
      }
    }

    if (newX) playerPos.x = newX
    if (newY) playerPos.y = newY
    if (newZ) playerPos.z = newZ

    playerPos.x += scaledVel.x
    playerPos.y += scaledVel.y
    playerPos.z += scaledVel.z

    scaledVel.multiplyScalar(DIMENSION / delta)
    this.vel.copy(scaledVel)

    const position = this.getObject().position
    position.set(playerPos.x, playerPos.y, playerPos.z)
    position.multiplyScalar(DIMENSION)
  }
  _handleKeyDown = event => {
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

        case 32: {
          // space
          this.movements.up = true
          break
        }

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
  _handleKeyUp = event => {
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

      case 32: {
        // space
        this.movements.up = false
        break
      }

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
  _handleMouseDown = e => {
    if (!this.chat.enabled && this.threeControls.isLocked)
      this.mouseKey = e.button
  }
}

export default PlayerControls
