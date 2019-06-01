import * as THREE from 'three'
import raycast from 'fast-voxel-raycast'

import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'

const DIMENSION = Config.block.dimension,
  REACT_DST = Config.player.reachDst,
  SIZE = Config.chunk.size

class PlayerViewpoint {
  constructor(scene, camera, controls, world) {
    // Connection to outerspace
    this.scene = scene
    this.camera = camera
    this.controls = controls
    this.world = world

    this.initGeoms()
  }

  initGeoms = () => {
    const box = new THREE.BoxGeometry(
      DIMENSION + 0.1,
      DIMENSION + 0.1,
      DIMENSION + 0.1
    )
    const wireframe = new THREE.WireframeGeometry(box)
    this.highlighter = new THREE.LineSegments(wireframe)

    this.boxhelper = new THREE.BoxHelper(this.highlighter, 0x070707)
    this.boxhelper.name = 'wireframe'

    this.scene.add(this.boxhelper)
    this.isWireframed = true
  }

  updateTPBlocks = () => {
    /** Updating targetted block */
    const blockInfo = this._getLookingBlockInfo()
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

  /**
   * INTERNAL FUNCTIONS
   */
  _getLookingBlockInfo = () => {
    const object = this.controls.getObject()

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
      REACT_DST * DIMENSION,
      point,
      normal
    )

    if (!result) return null

    // Global Block Coords
    const gbc = Helpers.toGlobalBlock({ x: point[0], y: point[1], z: point[2] })

    // Chunk Coords and Block Coords
    const { coordx: cx, coordy: cy, coordz: cz } = Helpers.toChunkCoords(gbc),
      bc = Helpers.toBlockCoords(gbc)

    const chunkDim = SIZE * DIMENSION

    // Target for wireframe
    let targetwf = {
      x: cx * chunkDim + bc.x * DIMENSION,
      y: cy * chunkDim + bc.y * DIMENSION,
      z: cz * chunkDim + bc.z * DIMENSION
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

    targetwf.x -= 0.05 - offset
    targetwf.y -= 0.05 - offset
    targetwf.z -= 0.05 - offset

    return { target, targetwf, potential }
  }
}

export default PlayerViewpoint
