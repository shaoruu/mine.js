import Config from '../../../../config/config'
import Helpers from '../../../../utils/helpers'

import * as THREE from 'three'
import raycast from 'fast-voxel-raycast'

const SIZE = Config.chunk.size
const DIMENSION = Config.block.dimension
const WATER_COLOR = Config.world.waterColor
const ROLL_OVER_COLOR = Config.player.rollOverColor
const REACH_DIST = Config.player.reachDst

const helmetName = 'player-viewport'
const rollOverName = 'block-roll-over'

function Viewport(player, world, scene) {
  let isChanged = false
  let isRolledOver = false

  /** MESH SETUP */
  const helmetGeo = new THREE.BoxBufferGeometry(
    DIMENSION * 2,
    DIMENSION * 2,
    DIMENSION * 2
  )
  const helmetMat = new THREE.MeshBasicMaterial({
    opacity: 0,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  })
  const helmet = new THREE.Mesh(helmetGeo, helmetMat)

  const rollOverBaseGeo = new THREE.BoxBufferGeometry(
    DIMENSION,
    DIMENSION,
    DIMENSION
  )
  const rollOverEdgeGeo = new THREE.EdgesGeometry(rollOverBaseGeo)
  const rollOverMat = new THREE.LineBasicMaterial({
    opacity: 0.3,
    transparent: true,
    side: THREE.FrontSide,
    color: ROLL_OVER_COLOR,
    linewidth: 8
  })
  const rollOver = new THREE.LineSegments(rollOverEdgeGeo, rollOverMat)

  helmet.name = helmetName
  rollOver.name = rollOverName

  helmetMat.polygonOffset = true
  helmetMat.polygonOffsetFactor = -0.5
  helmet.renderOrder = 2

  rollOverMat.polygonOffset = true
  rollOverMat.polygonOffsetFactor = -0.5

  this.setIsChanged = bool => (isChanged = bool)
  this.setIsRolledOver = bool => (isRolledOver = bool)

  this.getPlayer = () => player
  this.getWorld = () => world
  this.getScene = () => scene
  this.getHelmetMat = () => helmetMat
  this.getHelmet = () => helmet
  this.getIsChanged = () => isChanged
  this.getRollOver = () => rollOver
  this.getIsRolledOver = () => isRolledOver
}

Viewport.prototype.tick = function() {
  this.updateHelmet()
  this.updateTPBlock()
}

Viewport.prototype.updateHelmet = function() {
  const playerRef = this.getPlayer()
  const worldRef = this.getWorld()

  /* -------------------------------------------------------------------------- */
  /*                          VIEWPORT COLOR FILTERING                          */
  /* -------------------------------------------------------------------------- */
  const helmetRef = this.getHelmet()

  const camPos = playerRef.getCamPos()

  helmetRef.position.set(camPos.x, camPos.y, camPos.z)

  const coords = playerRef.getCamCoordinates(0)
  const camInType = worldRef.getVoxelByVoxelCoords(coords.x, coords.y, coords.z)
  switch (camInType) {
    case 9:
      if (!this.getIsChanged()) {
        this.addSelf(this.getScene())
        this.setIsChanged(true)
      }
      playerRef.status.setDiving(true)
      this.setFilter(WATER_COLOR, 0.2)
      break
    default:
      playerRef.status.setDiving(false)
      if (this.getIsChanged()) this.reset()
      break
  }
}

Viewport.prototype.updateTPBlock = function() {
  /* -------------------------------------------------------------------------- */
  /*                       VIEWPORT BLOCK ROLL OVER UPDATE                      */
  /* -------------------------------------------------------------------------- */
  const playerRef = this.getPlayer()
  const worldRef = this.getWorld()

  const blockInfo = this.getLookingBlockInfo()
  const rollOverRef = this.getRollOver()

  if (blockInfo) {
    const { target, targetwf, potential } = blockInfo
    const { x, y, z } = targetwf

    // Signal to world
    worldRef.setTarget(target)
    worldRef.setPotential(potential)

    if (
      x !== rollOverRef.position.x ||
      y !== rollOverRef.position.y ||
      z !== rollOverRef.position.z
    )
      rollOverRef.position.set(x, y, z)

    if (!this.getIsRolledOver()) {
      if (rollOverRef instanceof THREE.Object3D)
        this.getScene().add(rollOverRef)
      this.setIsRolledOver(true)
    }
  } else {
    this.removeTPBlocks()
  }

  if (playerRef.status.isSpectator && this.getIsRolledOver())
    this.removeTPBlocks(blockInfo)
}

Viewport.prototype.addSelf = function(scene) {
  scene.add(this.getHelmet())
}

Viewport.prototype.setFilter = function(color, opacity) {
  const materialRef = this.getHelmetMat()
  materialRef.color.set(color)
  materialRef.opacity = opacity
}

Viewport.prototype.resetFilter = function() {
  this.setFilter(0xffffff, 0)
}

Viewport.prototype.reset = function() {
  this.resetFilter()
  this.setIsChanged(false)

  const sceneRef = this.getScene()

  const helmet = sceneRef.getObjectByName(helmetName)
  if (helmet) sceneRef.remove(helmet)
}

Viewport.prototype.removeTPBlocks = function(blockInfo) {
  const obj = this.getScene().getObjectByName(rollOverName)
  const worldRef = this.getWorld()

  // Clearing world potentials
  if (!blockInfo) {
    worldRef.setTarget(null)
    worldRef.setPotential(null)
  }

  if (obj) {
    this.getScene().remove(obj)
    this.setIsRolledOver(false)
  }
}

Viewport.prototype.getLookingBlockInfo = function() {
  const playerRef = this.getPlayer()
  const objectRef = playerRef.getObject()

  const camDir = new THREE.Vector3()
  playerRef.getCamera().getWorldDirection(camDir)
  camDir.normalize()
  if (playerRef.controls.cameraMode.perspective === 'third')
    camDir.multiplyScalar(-1)

  const camPos = objectRef.position

  const point = []
  const normal = []

  const result = raycast(
    this.getWorld().getSolidityByWorldCoords,
    [camPos.x, camPos.y, camPos.z],
    [camDir.x, camDir.y, camDir.z],
    REACH_DIST * DIMENSION,
    point,
    normal
  )

  if (!result) return null

  // Global Block Coords
  const gbc = Helpers.worldToBlock({ x: point[0], y: point[1], z: point[2] })

  const {
    coordx: cx,
    coordy: cy,
    coordz: cz
  } = Helpers.globalBlockToChunkCoords(gbc)
  const bc = Helpers.globalBlockToChunkBlock(gbc)

  const chunkDim = SIZE * DIMENSION

  // Target for wireframe
  const targetwf = {
    x: cx * chunkDim + bc.x * DIMENSION,
    y: cy * chunkDim + bc.y * DIMENSION,
    z: cz * chunkDim + bc.z * DIMENSION
  }

  const target = {
    chunk: { cx, cy, cz },
    block: { ...bc },
    neighbors: []
  }

  const potential = {
    chunk: { cx, cy, cz },
    block: { ...bc }
  }

  /* eslint eqeqeq: "off" */
  let axis
  let chunkxis
  if (Math.abs(normal[0]).toFixed(1) == 1) {
    axis = 'x'
    chunkxis = 'cx'
    if (normal[0] >= 1) {
      // y-z plane
      targetwf.x = cx * chunkDim + (bc.x - 1) * DIMENSION
      target.block.x -= 1
    } else potential.block.x -= 1
  } else if (Math.abs(normal[1]).toFixed(1) == 1) {
    axis = 'y'
    chunkxis = 'cy'
    if (normal[1] >= 1) {
      // x-z plane
      targetwf.y = cy * chunkDim + (bc.y - 1) * DIMENSION
      target.block.y -= 1
    } else potential.block.y -= 1
  } else if (Math.abs(normal[2]).toFixed(1) == 1) {
    axis = 'z'
    chunkxis = 'cz'
    if (normal[2] >= 1) {
      // x-y plane
      targetwf.z = cz * chunkDim + (bc.z - 1) * DIMENSION
      target.block.z -= 1
    } else potential.block.z -= 1
  }

  /** adjusting target and potential to correct chunks */
  if (target.block[axis] < 0) {
    target.block[axis] = SIZE - 1
    target.chunk[chunkxis] -= 1
  } else if (target.block[axis] > SIZE - 1) {
    target.block[axis] = 0
    target.chunk[chunkxis] += 1
  }

  if (potential.block[axis] < 0) {
    potential.block[axis] = SIZE - 1
    potential.chunk[chunkxis] -= 1
  } else if (potential.block[axis] > SIZE - 1) {
    potential.block[axis] = 0
    potential.chunk[chunkxis] += 1
  }

  // add 0.5 to fix center of geometry offset.
  const offset = 0.5 * DIMENSION

  targetwf.x += offset
  targetwf.y += offset
  targetwf.z += offset

  return { target, targetwf, potential }
}

export default Viewport
