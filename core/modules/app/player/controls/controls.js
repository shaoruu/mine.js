import { Keyboard } from '../../../../lib/userInputs'
import Config from '../../../../config/config'
import Helpers from '../../../../utils/helpers'

import PointerLockControls from './pointerLockControls'
import MouseControl from './mouseControl'

import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import { easeQuadOut } from 'd3-ease'

const {
  movements: MOVEMENT_KEYS,
  multiplayer: MULTIPLAYER_KEYS,
  camera: CAMERA_KEYS,
  inventory: INVENTORY_KEYS
} = Config.keyboard
const HORZ_MAX_SPEED = Config.player.maxSpeed.horizontal
const VERT_MAX_SPEED = Config.player.maxSpeed.vertical
const SPECTATOR_INERTIA = Config.player.inertia
const INERTIA = Config.player.inertia
const FRIC_INERTIA = Config.player.fricIntertia
const IN_AIR_INERTIA = Config.player.inAirInertia
const SNEAK_TIME = Config.player.times.sneakTime
const SPRINT_FACTOR = Config.player.sprintFactor
const FORW_ACC = Config.player.acceleration.forward
const OTHER_HORZ_ACC = Config.player.acceleration.other_horz
const VERTICAL_ACC = Config.player.acceleration.vertical
const JUMP_TIME = Config.player.jump.time
const JUMP_FORCE = Config.player.jump.force
const GRAVITY = Config.world.gravity
const DIMENSION = Config.block.dimension
const COORD_DEC = Config.player.coordinateDec
const P_WIDTH = Config.player.aabb.width
const P_DEPTH = Config.player.aabb.depth
const P_I_2_TOE = Config.player.aabb.eye2toe
const P_I_2_TOP = Config.player.aabb.eye2top
const CAMERA_CONFIG = Config.camera
const SNEAK_DIFF = Config.player.aabb.sneakDifference
const PLAYER_HEIGHT = P_I_2_TOE + P_I_2_TOP
const CAM_SNEAK_DIFF = SNEAK_DIFF * PLAYER_HEIGHT * DIMENSION
const SNEAK_CONSTANT = Config.player.sneakConstant

class Controls {
  constructor(
    player,
    world,
    status,
    camera,
    canvas,
    blocker,
    button,
    initPos,
    initDir
  ) {
    /** THREEJS CAMERA CONTROL */
    this.threeControls = new PointerLockControls(
      player,
      camera,
      canvas,
      initPos,
      initDir
    )

    this.mouseControl = new MouseControl(
      player,
      world,
      status,
      this.threeControls
    )

    /** PHYSICS */
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

    this.cameraMode = {
      perspective: 'first'
    }

    this.currJumpTime = 0
    this.jumping = false

    this.sneakNode = null

    this.prevTime = performance.now()

    /** USER INPUTS */
    this.keyboard = new Keyboard()
    this.keyboard.initialize()

    /** CONNECTIONS TO OUTER SPACE */
    this.player = player
    this.world = world
    this.camera = camera
    this.canvas = canvas
    this.blocker = blocker
    this.button = button
    this.status = status

    this.initListeners()
    this.setCameraMode()
  }

  initListeners = () => {
    this.button.addEventListener('click', this.unblockGame, false)
    this.threeControls.addEventListener('unlock', this.blockGame, false)

    /** REGISTER KEYS */
    this.registerKeys()
  }

  tick = () => {
    this.setCameraMode()
    this.handleMovements()
    this.mouseControl.tick()
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */
  handleMovements = () => {
    const now = performance.now()
    const {
      isFlying,
      isOnGround,
      shouldGravity,
      isSprinting,
      isSpectator
    } = this.status

    let delta = (now - this.prevTime) / 1000
    if (delta > 0.15) delta = 0.1

    this.calculateAccelerations()

    // Update velocity with inertia
    this.vel.x -=
      this.vel.x *
      (isFlying
        ? isSpectator
          ? SPECTATOR_INERTIA
          : INERTIA
        : (isOnGround ? FRIC_INERTIA : IN_AIR_INERTIA) /
          (isSprinting ? SPRINT_FACTOR : 1)) *
      delta
    if (!shouldGravity) this.vel.y -= this.vel.y * INERTIA * delta
    this.vel.z -=
      this.vel.z *
      (isFlying
        ? isSpectator
          ? SPECTATOR_INERTIA
          : INERTIA
        : (isOnGround ? FRIC_INERTIA : IN_AIR_INERTIA) /
          (isSprinting ? SPRINT_FACTOR : 1)) *
      delta

    if (this.needsToJump) {
      this.jumping = true
      this.currJumpTime = JUMP_TIME
      this.needsToJump = false
    }

    if (this.currJumpTime > 0 && this.jumping) {
      const jf = easeQuadOut(this.currJumpTime / JUMP_TIME) * JUMP_FORCE
      this.acc.y += jf // !?????
      this.currJumpTime -= delta * 1000
    }

    if (this.currJumpTime <= 0) {
      this.jumping = false
      this.currJumpTime = 0
    }

    this.vel.add(this.acc)
    this.acc.set(0.0, 0.0, 0.0)

    if (shouldGravity && !this.freshlyJumped) this.vel.y += GRAVITY

    this.vel.multiplyScalar(delta)

    if (this.vel.x > HORZ_MAX_SPEED) this.vel.x = HORZ_MAX_SPEED
    else if (this.vel.x < -HORZ_MAX_SPEED) this.vel.x = -HORZ_MAX_SPEED
    if (this.vel.y > VERT_MAX_SPEED) this.vel.y = VERT_MAX_SPEED
    else if (this.vel.y < -VERT_MAX_SPEED) this.vel.y = -VERT_MAX_SPEED
    if (this.vel.z > HORZ_MAX_SPEED) this.vel.z = HORZ_MAX_SPEED
    else if (this.vel.z < -HORZ_MAX_SPEED) this.vel.z = -HORZ_MAX_SPEED

    this.handleCollisions()

    this.vel.divideScalar(delta)

    this.prevTime = now
    this.freshlyJumped = false
  }

  calculateAccelerations = () => {
    const { diry } = this.getDirections()

    // Extract movement info for later convenience
    const { up, down, left, right, forward, backward } = this.movements

    if (up) {
      if (this.status.isFlying) this.acc.y += VERTICAL_ACC
      else if (this.status.canJump) {
        // SURVIVAL MODE
        this.needsToJump = true
        this.freshlyJumped = true
        this.status.registerJump()
      }
    } else if (down) {
      if (this.status.isSneaking && this.freshlySneaked && !this.sneakTween) {
        this.unsneakTween = undefined
        this.sneakTween = new TWEEN.Tween(this.camera.position)
          .to({ y: -CAM_SNEAK_DIFF }, SNEAK_TIME)
          .start()
          .onComplete(() => {
            this.freshlySneaked = false
          })
      } else if (!this.status.isSneaking && this.status.isFlying)
        this.acc.y -= VERTICAL_ACC
    }
    if (
      !this.status.isSneaking &&
      this.freshlyUnsneaked &&
      !this.status.isFlying
    ) {
      this.unsneakTween = new TWEEN.Tween(this.camera.position)
        .to({ y: 0 }, SNEAK_TIME)
        .start()
        .onComplete(() => {
          this.freshlyUnsneaked = false
        })
    }
    let acceleration = OTHER_HORZ_ACC
    if (this.status.isSneaking) acceleration *= SNEAK_CONSTANT
    if (left) {
      this.acc.x += -Math.sin(diry + Math.PI / 2) * acceleration
      this.acc.z += -Math.cos(diry + Math.PI / 2) * acceleration
    }

    if (right) {
      this.acc.x += Math.sin(diry + Math.PI / 2) * acceleration
      this.acc.z += Math.cos(diry + Math.PI / 2) * acceleration
    }

    if (forward) {
      // TODO: implement sprint here.
      acceleration = FORW_ACC
      if (this.status.isSneaking) acceleration *= SNEAK_CONSTANT
      this.acc.x += -Math.sin(diry) * acceleration
      this.acc.z += -Math.cos(diry) * acceleration
    }

    if (backward) {
      this.acc.x += Math.sin(diry) * acceleration
      this.acc.z += Math.cos(diry) * acceleration
    }
  }

  setCameraMode = () => {
    if (this.cameraMode.perspective === 'first') {
      this.camera.rotation.y = 0
      this.player.skin.setVisible(false)
      this.camera.position.set(
        CAMERA_CONFIG.posX,
        CAMERA_CONFIG.posY,
        CAMERA_CONFIG.posZ
      )
    } else if (this.cameraMode.perspective === 'second') {
      this.player.skin.setVisible(true)
      this.camera.position.set(
        CAMERA_CONFIG.thirdPerson.posX,
        CAMERA_CONFIG.thirdPerson.posY,
        CAMERA_CONFIG.thirdPerson.posZ
      )
    } else if (this.cameraMode.perspective === 'third') {
      this.player.skin.setVisible(true)
      this.camera.position.set(
        CAMERA_CONFIG.secondPerson.posX,
        CAMERA_CONFIG.secondPerson.posY,
        CAMERA_CONFIG.secondPerson.posZ
      )
      this.camera.rotation.y = Math.PI
    }
  }

  isCameraThirdPerson = () => this.cameraMode.perspective !== 'first'

  registerKeys = () => {
    const chatRef = this.world.getChat()
    /**
     * CHAT KEYS ('chat')
     */
    this.keyboard.registerKey(
      13,
      'chat',
      () => {
        chatRef.handleEnter()
        chatRef.disable()
      },
      this.unblockGame,
      undefined,
      { repeat: false }
    )
    this.keyboard.registerKey(38, 'chat', chatRef.handleUp) // up
    this.keyboard.registerKey(40, 'chat', chatRef.handleDown) // down

    this.keyboard.registerKey(
      27,
      'chat',
      chatRef.disable,
      this.unblockGame,
      undefined,
      {
        repeat: false
      }
    )

    /**
     * moving KEYS ('moving')
     */
    this.keyboard.registerKeys([112, 74], 'moving', () => {
      if (this.f1) this.canvas.style.zIndex = '1'
      else this.canvas.style.zIndex = '4'
      this.f1 = !this.f1
    })

    this.keyboard.registerKey(
      MOVEMENT_KEYS.forward,
      'moving',
      () => (this.movements.forward = true),
      () => {
        this.movements.forward = false
        this.status.registerWalk()
      },
      () => {
        if (!this.status.isHungry) this.status.registerSprint()
      },
      { immediate: true }
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.backward,
      'moving',
      () => (this.movements.backward = true),
      () => (this.movements.backward = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.left,
      'moving',
      () => (this.movements.left = true),
      () => (this.movements.left = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.right,
      'moving',
      () => (this.movements.right = true),
      () => (this.movements.right = false)
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.jump,
      'moving',
      () => (this.movements.up = true),
      () => (this.movements.up = false),
      () => {
        if (this.status.canFly && this.status.isCreative)
          this.status.toggleFly()
      },
      { immediate: true }
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.sneak,
      'moving',
      () => {
        this.movements.down = true
        this.freshlySneaked = true
      },
      () => {
        this.movements.down = false
        this.sneakNode = null
        this.sneakTween = undefined
        this.freshlyUnsneaked = true
      }
    )

    this.keyboard.registerKey(CAMERA_KEYS.togglePerspective, 'moving', () => {
      const { perspective } = this.cameraMode
      if (perspective === 'third') {
        this.cameraMode.perspective = 'first'
      } else if (perspective === 'second') {
        this.cameraMode.perspective = 'third'
      } else {
        this.cameraMode.perspective = 'second'
      }
    })

    this.keyboard.registerKey(MULTIPLAYER_KEYS.openChat, 'moving', () => {
      this.threeControls.unlock()
      chatRef.enable()
      this.keyboard.setScope('chat')
    })

    this.keyboard.registerKey(MULTIPLAYER_KEYS.openCommand, 'moving', () => {
      this.threeControls.unlock()
      chatRef.enable(false)
      this.keyboard.setScope('chat')
    })

    /* INVENTORY TOOLBAR */
    this.keyboard.registerIndexedKeyGroup(INVENTORY_KEYS, 'moving', index => {
      if (this.player.inventory.getCursor() !== index - 1) {
        this.player.inventory.select(index - 1)
      }
    })

    // F3 with 'x' as backup
    this.keyboard.registerKeys([114, 88], 'moving', () => this.debug.toggle())

    /**
     * Not in game ('menu')
     */
    this.keyboard.registerKey(
      27, // esc
      'menu',
      undefined,
      this.unblockGame,
      undefined,
      { repeat: false }
    )

    /**
     * DEV TOOLS
     */
    this.keyboard.registerKey(66, 'moving', this.status.toggleSprint)
    this.keyboard.registerKey(78, 'moving', this.status.toggleFly)
  }

  handleCollisions = () => {
    // AABB
    const playerPos = this.getNormalizedObjPos(10)
    const scaledVel = this.vel.clone().multiplyScalar(1 / DIMENSION)

    const EPSILON = 1 / 1024

    if (Math.abs(scaledVel.x) > Math.abs(scaledVel.z)) {
      this.handleXCollision(playerPos, scaledVel, EPSILON)
      this.handleZCollision(playerPos, scaledVel, EPSILON)
    } else {
      this.handleZCollision(playerPos, scaledVel, EPSILON)
      this.handleXCollision(playerPos, scaledVel, EPSILON)
    }
    this.handleYCollision(playerPos, scaledVel, EPSILON)

    scaledVel.multiplyScalar(DIMENSION)
    this.vel.copy(scaledVel)

    const { position } = this.getObject()
    position.set(playerPos.x, playerPos.y, playerPos.z)
    position.multiplyScalar(DIMENSION)
  }

  handleXCollision = (playerPos, scaledVel, EPSILON) => {
    // X-AXIS COLLISION
    let newX

    if (!Helpers.approxEquals(scaledVel.x, 0) && !this.status.isSpectator) {
      const minX = playerPos.x - P_WIDTH / 2
      const maxX = playerPos.x + P_WIDTH / 2
      const minY = Math.floor(playerPos.y - P_I_2_TOE)
      const maxY = Math.floor(playerPos.y + P_I_2_TOP)
      const minZ = Math.floor(playerPos.z - P_DEPTH / 2)
      const maxZ = Math.floor(playerPos.z + P_DEPTH / 2)

      const isPos = scaledVel.x > 0

      let startX
      let endX
      if (scaledVel.x > 0) {
        startX = maxX
        endX = maxX + scaledVel.x
      } else {
        startX = minX + scaledVel.x
        endX = minX
      }

      for (
        let posX = isPos ? endX : startX;
        isPos ? posX >= startX : posX <= endX;
        isPos ? posX-- : posX++
      ) {
        let voxelExists = false
        for (let y = minY; y <= maxY; y++) {
          if (voxelExists) break
          for (let z = minZ; z <= maxZ; z++)
            if (this.world.getPassableByVoxelCoords(Math.floor(posX), y, z)) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.x > 0) newX = Math.floor(posX) - P_WIDTH / 2 - EPSILON
          else newX = Math.ceil(posX) + P_WIDTH / 2 + EPSILON
          scaledVel.x = 0
          break
        }
      }
    }

    if (newX) playerPos.x = newX
    playerPos.x += scaledVel.x
  }

  handleYCollision = (playerPos, scaledVel, EPSILON) => {
    // Y-AXIS COLLISION
    let newY

    if (!Helpers.approxEquals(scaledVel.y, 0) && !this.status.isSpectator) {
      const minY = playerPos.y - P_I_2_TOE
      const maxY = playerPos.y + P_I_2_TOP
      const minX = Math.floor(playerPos.x - P_WIDTH / 2)
      const maxX = Math.floor(playerPos.x + P_WIDTH / 2)
      const minZ = Math.floor(playerPos.z - P_DEPTH / 2)
      const maxZ = Math.floor(playerPos.z + P_DEPTH / 2)

      const isPos = scaledVel.y > 0

      let startY
      let endY
      if (scaledVel.y > 0) {
        startY = maxY
        endY = maxY + scaledVel.y
      } else {
        startY = minY + scaledVel.y
        endY = minY
      }

      for (
        let posY = isPos ? endY : startY;
        isPos ? posY >= startY : posY <= endY;
        isPos ? posY-- : posY++
      ) {
        let voxelExists = false
        for (let x = minX; x <= maxX; x++) {
          if (voxelExists) break
          for (let z = minZ; z <= maxZ; z++)
            if (this.world.getPassableByVoxelCoords(x, Math.floor(posY), z)) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.y > 0) newY = Math.floor(posY) - P_I_2_TOP - EPSILON
          else {
            this.status.registerLand()
            newY = Math.floor(posY) + 1 + P_I_2_TOE + EPSILON
          }

          this.jumping = false

          scaledVel.y = 0
          break
        }
      }
    }

    if (newY) playerPos.y = newY
    playerPos.y += scaledVel.y
  }

  handleZCollision = (playerPos, scaledVel, EPSILON) => {
    // Z-AXIS COLLISION
    let newZ

    if (!Helpers.approxEquals(scaledVel.z, 0) && !this.status.isSpectator) {
      const minZ = playerPos.z - P_DEPTH / 2
      const maxZ = playerPos.z + P_DEPTH / 2
      const minX = Math.floor(playerPos.x - P_WIDTH / 2)
      const maxX = Math.floor(playerPos.x + P_WIDTH / 2)
      const minY = Math.floor(playerPos.y - P_I_2_TOE)
      const maxY = Math.floor(playerPos.y + P_I_2_TOP)

      const isPos = scaledVel.z > 0

      let startZ
      let endZ
      if (scaledVel.z > 0) {
        startZ = maxZ
        endZ = maxZ + scaledVel.z
      } else {
        startZ = minZ + scaledVel.z
        endZ = minZ
      }

      for (
        let posZ = isPos ? endZ : startZ;
        isPos ? posZ >= startZ : posZ <= endZ;
        isPos ? posZ-- : posZ++
      ) {
        let voxelExists = false
        for (let x = minX; x <= maxX; x++) {
          if (voxelExists) break
          for (let y = minY; y <= maxY; y++)
            if (this.world.getPassableByVoxelCoords(x, y, Math.floor(posZ))) {
              voxelExists = true
              break
            }
        }

        if (voxelExists) {
          if (scaledVel.z > 0) newZ = Math.floor(posZ) - P_DEPTH / 2 - EPSILON
          else newZ = Math.ceil(posZ) + P_DEPTH / 2 + EPSILON
          scaledVel.z = 0
          break
        }
      }
    }

    if (newZ) playerPos.z = newZ
    playerPos.z += scaledVel.z
  }

  unblockGame = () => {
    this.blocker.style.display = 'none'
    this.keyboard.setScope('moving')
    this.threeControls.lock()
  }

  blockGame = () => {
    this.resetMovements()
    if (!this.world.getChat().enabled) {
      this.keyboard.setScope('menu')
      this.blocker.style.display = 'flex'
    }
  }

  resetMovements = () =>
    (this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      down: false,
      up: false
    })

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getDirections = () => {
    return {
      dirx: Helpers.round(this.threeControls.getPitch().rotation.x, COORD_DEC),
      diry: Helpers.round(this.threeControls.getObject().rotation.y, COORD_DEC)
    }
  }

  getObject = () => this.threeControls.getObject()

  getNormalizedCamPos = (dec = COORD_DEC) => {
    const position = this.getCamPos()
    return Helpers.floorPos(Helpers.worldToBlock(position, false), dec)
  }

  getCamPos = () => {
    const position = new THREE.Vector3()
    this.camera.getWorldPosition(position)
    return Helpers.floorPos(position, 0)
  }

  getNormalizedObjPos = (dec = COORD_DEC) => {
    // Normalized as in normalized to world coordinates
    const position = this.getObject().position.clone()
    return Helpers.floorPos(Helpers.worldToBlock(position, false), dec)
  }

  getFeetCoords = (dec = COORD_DEC) => {
    // This is essentially where the foot of the player is
    const camPos = this.getNormalizedObjPos(dec)
    camPos.y -= P_I_2_TOE
    return camPos
  }

  getChunkCoords = () => {
    const pos = this.getFeetCoords()
    const chunkBPos = Helpers.globalBlockToChunkBlock({ ...pos })
    const chunkPos = Helpers.globalBlockToChunkCoords({ ...pos })
    return { ...chunkBPos, ...chunkPos }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setDebugControl = debug => (this.debug = debug)
}

export default Controls
