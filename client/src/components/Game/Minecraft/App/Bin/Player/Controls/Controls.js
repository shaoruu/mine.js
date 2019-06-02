import * as THREE from 'three'

import PointerLockControls from './PointerLockControls'
import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'
import Stateful from '../../../../Utils/Stateful'
import Keyboard from './Keyboard'

const HORZ_MAX_SPEED = Config.player.maxSpeed.horizontal,
  VERT_MAX_SPEED = Config.player.maxSpeed.vertical,
  INERTIA = Config.player.inertia,
  FORW_BACK_ACC = Config.player.acceleration.forwardbackward,
  LEFT_RIGHT_ACC = Config.player.acceleration.leftright,
  VERITCAL_ACC = Config.player.acceleration.vertical,
  JUMP_ACC = Config.player.acceleration.jump,
  FRICTION_COEF = Config.player.frictionCoef,
  COORD_DEC = Config.player.coordinateDec,
  DIMENSION = Config.block.dimension,
  P_WIDTH = Config.player.aabb.width,
  P_DEPTH = Config.player.aabb.depth,
  P_I_2_TOE = Config.player.aabb.eye2toe,
  P_I_2_TOP = Config.player.aabb.eye2top,
  {
    movements: MOVEMENT_KEYS,
    inventory: INVENTORY_KEYS,
    multiplayer: MULTIPLAYER_KEYS
  } = Config.keyboard,
  GRAVITY = Config.world.gravity,
  SPRINT_FACTOR = Config.player.sprintFactor

class PlayerControls extends Stateful {
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
    super()

    this.state = {
      isOnGround: false,
      isJumped: false,
      isSprinting: false
    }

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
    this.keyboard = new Keyboard()
    this.keyboard.initialize()

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
    this.blocker.addEventListener('click', () => this._unblockGame(), false)

    this.threeControls.addEventListener(
      'unlock',
      () => this._blockGame(),
      false
    )

    // Register Game Keys
    this._registerKeys()
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
    const { isOnGround } = this.state

    let delta = (now - this.prevTime) / 1000

    if (delta > 0.5) delta = 0.01

    this._calculateAccelerations()

    // Update velocity with inertia
    this.vel.x -= this.vel.x * INERTIA * delta
    if (!isOnGround) this.vel.y -= this.vel.y * INERTIA * delta
    this.vel.z -= this.vel.z * INERTIA * delta

    this.vel.add(this.acc)
    this.acc.set(0.0, 0.0, 0.0)

    if (isOnGround) this.vel.y += GRAVITY

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
    const { isOnGround, isJumped, isSprinting } = this.state

    // Extract movement info for later convenience
    const { up, down, left, right, forward, backward } = this.movements

    const forw_back_acc =
      FORW_BACK_ACC *
      (isOnGround ? FRICTION_COEF : 1) *
      (isSprinting ? SPRINT_FACTOR : 1)
    const left_right_acc =
      LEFT_RIGHT_ACC * (isOnGround && !isJumped ? FRICTION_COEF ** 2 : 1)
    const vert_acc = VERITCAL_ACC * (isOnGround ? FRICTION_COEF : 1)

    if (up) {
      // TODO: add fly/land mode here
      if (!isOnGround) this.acc.y += vert_acc
      else if (!isJumped) {
        this.vel.y += JUMP_ACC
        this.setState({ isJumped: true })
      }
    } else if (down) {
      // TODO: shifting
      if (!isOnGround) this.acc.y -= vert_acc
    }

    if (left) {
      this.acc.x += -Math.sin(diry + Math.PI / 2) * left_right_acc
      this.acc.z += -Math.cos(diry + Math.PI / 2) * left_right_acc
    }

    if (right) {
      this.acc.x += Math.sin(diry + Math.PI / 2) * left_right_acc
      this.acc.z += Math.cos(diry + Math.PI / 2) * left_right_acc
    }

    if (forward) {
      // TODO: implement sprint here.
      this.acc.x += -Math.sin(diry) * forw_back_acc
      this.acc.z += -Math.cos(diry) * forw_back_acc
    }

    if (backward) {
      this.acc.x += Math.sin(diry) * forw_back_acc
      this.acc.z += Math.cos(diry) * forw_back_acc
    }
  }
  _handleCollisions = delta => {
    const { isOnGround, isJumped } = this.state

    // AABB
    const playerPos = this.getNormalizedCamPos(10)
    const scaledVel = this.vel.clone().multiplyScalar(delta / DIMENSION)

    const coefPow = isJumped ? 1.8 : 2
    if (isOnGround) {
      scaledVel.x *= FRICTION_COEF ** coefPow
      scaledVel.z *= FRICTION_COEF ** coefPow
    }

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
          else {
            this.setState({ isOnGround: true, isJumped: false })
            newY = Math.floor(pos_y) + 1 + P_I_2_TOE + EPSILON
          }

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
  _registerKeys = () => {
    /**
     * CHAT KEYS ('chat-enabled')
     */
    this.keyboard.registerKey(13, 'chat-enabled', this.chat.handleEnter)
    // this.keyboard.registerKey(38, ) // up
    // this.keyboard.registerKey(40, ) // down
    this.keyboard.registerKey(37, 'chat-enabled', this.chat.input.left)
    this.keyboard.registerKey(39, 'chat-enabled', this.chat.input.right)

    this.keyboard.setScopeDefaultHandler('chat-enabled', event => {
      const char = String.fromCharCode(event.keyCode)
      this.chat.input.insert(char)
    })

    /**
     * IN-GAME KEYS ('in-game')
     */
    this.keyboard.registerIndexedKeyGroup(
      [
        INVENTORY_KEYS.h1,
        INVENTORY_KEYS.h2,
        INVENTORY_KEYS.h3,
        INVENTORY_KEYS.h4,
        INVENTORY_KEYS.h5,
        INVENTORY_KEYS.h6,
        INVENTORY_KEYS.h7,
        INVENTORY_KEYS.h8,
        INVENTORY_KEYS.h9
      ],
      'in-game',
      index => {
        if (this.player.inventory.getCursor() !== index) {
          this.player.mutateSelf({ cursor: index })
          this.player.inventory.switchHotbar(index)
        }
      }
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.forward,
      'in-game',
      () => (this.movements.forward = true),
      () => {
        this.movements.forward = false
        this.setState({ isSprinting: false })
      },
      () => this.setState({ isSprinting: true }),
      { immediate: true }
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.backward,
      'in-game',
      () => (this.movements.backward = true),
      () => (this.movements.backward = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.left,
      'in-game',
      () => (this.movements.left = true),
      () => (this.movements.left = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.right,
      'in-game',
      () => (this.movements.right = true),
      () => (this.movements.right = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.jump,
      'in-game',
      () => {
        this.movements.up = true
      },
      () => {
        this.movements.up = false
      },
      () => this.setState({ isOnGround: false })
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.sneak,
      'in-game',
      () => (this.movements.down = true),
      () => (this.movements.down = false)
    )

    this.keyboard.registerKey(MULTIPLAYER_KEYS.openChat, 'in-game', () => {
      this.chat.enable()
      this.threeControls.unlock()
    })

    this.keyboard.registerKey(
      27, // esc
      'in-game',
      null,
      () => {
        if (this.chat.enabled) {
          this.chat.disable()
          if (!this.threeControls.isLocked) this.threeControls.lock()
        } else this.blocker.style.display = 'block'
      }
    )

    /**
     * Default ('default')
     */
    this.keyboard.registerKey(
      27, // esc
      'blocked',
      null,
      () => this._unblockGame()
    )
  }

  _handleMouseDown = e => {
    if (!this.chat.enabled && this.threeControls.isLocked)
      this.mouseKey = e.button
  }

  _unblockGame = () => {
    this.blocker.style.display = 'none'
    this.keyboard.setScope('in-game')
    this.threeControls.lock()
  }
  _blockGame = () => {
    this._resetMovements()
    if (!this.chat.enabled) {
      this.keyboard.setScope('blocked')
      this.blocker.style.display = 'block'
    }
  }
}

export default PlayerControls
