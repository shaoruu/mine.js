import { Keyboard } from '../../../../lib/userInputs'
import Config from '../../../../config/config'
import Helpers from '../../../../utils/helpers'

import PointerLockControls from './pointerLockControls'

import * as THREE from 'three'

/**
 *
 * REFERENCE:
 *  https://github.com/ian13456/minecraft.js/blob/master/client/src/components/Game/Minecraft/App/Player/Controls/Controls.js
 *
 */

const { movements: MOVEMENT_KEYS } = Config.keyboard
const HORZ_MAX_SPEED = Config.player.maxSpeed.horizontal
const VERT_MAX_SPEED = Config.player.maxSpeed.vertical
const SPECTATOR_INERTIA = Config.player.inertia
const INERTIA = Config.player.inertia
const FRIC_INERTIA = Config.player.fricIntertia
const IN_AIR_INERTIA = Config.player.inAirInertia
const SPRINT_FACTOR = Config.player.sprintFactor
const FORW_ACC = Config.player.acceleration.forward
const OTHER_HORZ_ACC = Config.player.acceleration.other_horz
const VERTICAL_ACC = Config.player.acceleration.vertical
const JUMP_ACC = Config.player.acceleration.jump
const GRAVITY = Config.world.gravity
const DIMENSION = Config.block.dimension
const COORD_DEC = Config.player.coordinateDec
const P_WIDTH = Config.player.aabb.width
const P_DEPTH = Config.player.aabb.depth
const P_I_2_TOE = Config.player.aabb.eye2toe
const P_I_2_TOP = Config.player.aabb.eye2top

class Controls {
  constructor(player, world, status, camera, container, blocker, initPos, initDir) {
    /** THREEJS CAMERA CONTROL */
    this.threeControls = new PointerLockControls(camera, container, initPos, initDir)

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

    this.sneakNode = null

    this.prevTime = performance.now()

    /** USER INPUTS */
    this.keyboard = new Keyboard()
    this.keyboard.initialize()

    /** CONNECTIONS TO OUTER SPACE */
    this.player = player
    this.world = world
    this.camera = camera
    this.blocker = blocker
    this.status = status

    this.initListeners()
  }

  initListeners = () => {
    this.blocker.addEventListener('click', this.unblockGame, false)
    this.threeControls.addEventListener('unlock', this.blockGame, false)

    /** REGISTER KEYS */
    this.registerKeys()
  }

  tick = () => {
    this.handleMovements()
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */
  handleMovements = () => {
    const now = performance.now()
    const { isFlying, isOnGround, shouldGravity, isSprinting, isSpectator } = this.status

    let delta = (now - this.prevTime) / 1000

    if (delta > 0.15) delta = 0.01

    this.calculateAccelerations()

    // Update velocity with inertia
    this.vel.x -=
      this.vel.x *
      (isFlying
        ? isSpectator
          ? SPECTATOR_INERTIA
          : INERTIA
        : (isOnGround ? FRIC_INERTIA : IN_AIR_INERTIA) / (isSprinting ? SPRINT_FACTOR : 1)) *
      delta
    if (!shouldGravity) this.vel.y -= this.vel.y * INERTIA * delta
    this.vel.z -=
      this.vel.z *
      (isFlying
        ? isSpectator
          ? SPECTATOR_INERTIA
          : INERTIA
        : (isOnGround ? FRIC_INERTIA : IN_AIR_INERTIA) / (isSprinting ? SPRINT_FACTOR : 1)) *
      delta

    this.vel.add(this.acc)
    this.acc.set(0.0, 0.0, 0.0)

    if (this.needsToJump) {
      this.vel.y += JUMP_ACC
      this.needsToJump = false
    }

    // APPLY GRAVITY
    if (shouldGravity && !this.freshlyJumped) this.vel.y += GRAVITY

    if (this.vel.x > HORZ_MAX_SPEED) this.vel.x = HORZ_MAX_SPEED
    else if (this.vel.x < -HORZ_MAX_SPEED) this.vel.x = -HORZ_MAX_SPEED
    if (this.vel.y > VERT_MAX_SPEED) this.vel.y = VERT_MAX_SPEED
    else if (this.vel.y < -VERT_MAX_SPEED) this.vel.y = -VERT_MAX_SPEED
    if (this.vel.z > HORZ_MAX_SPEED) this.vel.z = HORZ_MAX_SPEED
    else if (this.vel.z < -HORZ_MAX_SPEED) this.vel.z = -HORZ_MAX_SPEED

    this.handleCollisions(delta)

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
      if (!this.status.isSneaking && this.status.isFlying) this.acc.y -= VERTICAL_ACC
    }

    if (left) {
      this.acc.x += -Math.sin(diry + Math.PI / 2) * OTHER_HORZ_ACC
      this.acc.z += -Math.cos(diry + Math.PI / 2) * OTHER_HORZ_ACC
    }

    if (right) {
      this.acc.x += Math.sin(diry + Math.PI / 2) * OTHER_HORZ_ACC
      this.acc.z += Math.cos(diry + Math.PI / 2) * OTHER_HORZ_ACC
    }

    if (forward) {
      // TODO: implement sprint here.
      this.acc.x += -Math.sin(diry) * FORW_ACC
      this.acc.z += -Math.cos(diry) * FORW_ACC
    }

    if (backward) {
      this.acc.x += Math.sin(diry) * OTHER_HORZ_ACC
      this.acc.z += Math.cos(diry) * OTHER_HORZ_ACC
    }
  }

  registerKeys = () => {
    /**
     * moving KEYS ('moving')
     */
    this.keyboard.registerKey(
      MOVEMENT_KEYS.forward,
      'moving',
      () => (this.movements.forward = true),
      () => {
        this.movements.forward = false
        this.status.registerWalk()
      },
      this.status.registerSprint,
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
        if (this.status.canFly && this.status.isCreative) this.status.toggleFly()
      },
      { immediate: true }
    )

    this.keyboard.registerKey(
      MOVEMENT_KEYS.sneak,
      'moving',
      () => (this.movements.down = true),
      () => {
        this.movements.down = false
        this.sneakNode = null
      }
    )
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

  handleCollisions = delta => {
    // AABB
    const playerPos = this.getNormalizedCamPos(10)
    const scaledVel = this.vel.clone().multiplyScalar(delta / DIMENSION)

    const EPSILON = 1 / 1024

    if (Math.abs(scaledVel.x) > Math.abs(scaledVel.z)) {
      this.handleXCollision(playerPos, scaledVel, EPSILON)
      this.handleZCollision(playerPos, scaledVel, EPSILON)
    } else {
      this.handleZCollision(playerPos, scaledVel, EPSILON)
      this.handleXCollision(playerPos, scaledVel, EPSILON)
    }
    this.handleYCollision(playerPos, scaledVel, EPSILON)

    scaledVel.multiplyScalar(DIMENSION / delta)
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
            if (this.world.getVoxelByVoxelCoords(Math.floor(posX), y, z)) {
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
            if (this.world.getVoxelByVoxelCoords(x, Math.floor(posY), z)) {
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
            if (this.world.getVoxelByVoxelCoords(x, y, Math.floor(posZ))) {
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
    // if (!this.chat.enabled) {
    this.keyboard.setScope('menu')
    this.blocker.style.display = 'flex'
    // }
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
    // Normalized as in normalized to world coordinates
    const position = this.getObject().position.clone()
    return Helpers.roundPos(Helpers.worldToBlock(position, false), dec)
  }

  getFeetCoords = (dec = COORD_DEC) => {
    // This is essentially where the foot of the player is
    const camPos = this.getNormalizedCamPos(dec)
    camPos.y -= P_I_2_TOE
    return camPos
  }

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setDebugControl = debug => (this.debug = debug)
}

export default Controls
