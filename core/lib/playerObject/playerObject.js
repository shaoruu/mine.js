/* eslint-disable no-underscore-dangle, max-classes-per-file */
import Helpers from '../../utils/helpers'
import Config from '../../config/config'

import { loadSkinToCanvas, isSlimSkin } from './playerObjectUtils'

import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

const DIMENSION = Config.block.dimension
const EYE_2_TOE = Config.player.aabb.eye2toe
const EYE_2_TOP = Config.player.aabb.eye2top
// const HEAD_BODY_DEG = Config.player.headBodyDeg
const HEIGHT = EYE_2_TOE + EYE_2_TOP

function toFaceVertices(x1, y1, x2, y2, w, h) {
  return [
    new THREE.Vector2(x1 / w, 1.0 - y2 / h),
    new THREE.Vector2(x2 / w, 1.0 - y2 / h),
    new THREE.Vector2(x2 / w, 1.0 - y1 / h),
    new THREE.Vector2(x1 / w, 1.0 - y1 / h)
  ]
}

function toSkinVertices(x1, y1, x2, y2) {
  return toFaceVertices(x1, y1, x2, y2, 64.0, 64.0)
}

function setVertices(box, top, bottom, left, front, right, back) {
  box.faceVertexUvs[0] = []
  box.faceVertexUvs[0][0] = [right[3], right[0], right[2]]
  box.faceVertexUvs[0][1] = [right[0], right[1], right[2]]
  box.faceVertexUvs[0][2] = [left[3], left[0], left[2]]
  box.faceVertexUvs[0][3] = [left[0], left[1], left[2]]
  box.faceVertexUvs[0][4] = [top[3], top[0], top[2]]
  box.faceVertexUvs[0][5] = [top[0], top[1], top[2]]
  box.faceVertexUvs[0][6] = [bottom[0], bottom[3], bottom[1]]
  box.faceVertexUvs[0][7] = [bottom[3], bottom[2], bottom[1]]
  box.faceVertexUvs[0][8] = [front[3], front[0], front[2]]
  box.faceVertexUvs[0][9] = [front[0], front[1], front[2]]
  box.faceVertexUvs[0][10] = [back[3], back[0], back[2]]
  box.faceVertexUvs[0][11] = [back[0], back[1], back[2]]
}

const esp = 0.002
/**
 * Notice that innerLayer and outerLayer may NOT be the direct children of the Group.
 */
class BodyPart extends THREE.Group {
  constructor(innerLayer, outerLayer) {
    super()

    this.innerLayer = innerLayer
    this.outerLayer = outerLayer
    innerLayer.name = 'inner'
    outerLayer.name = 'outer'
  }
}

class SkinObject extends THREE.Group {
  constructor(layer1Material, layer2Material) {
    super()
    this.name = 'skin'
    this.visible = false
    this.modelListeners = [] // called when model(slim property) is changed
    this._slim = false

    // Head
    const headBox = new THREE.BoxGeometry(8, 8, 8, 0, 0, 0)
    setVertices(
      headBox,
      toSkinVertices(8, 0, 16, 8),
      toSkinVertices(16, 0, 24, 8),
      toSkinVertices(0, 8, 8, 16),
      toSkinVertices(8, 8, 16, 16),
      toSkinVertices(16, 8, 24, 16),
      toSkinVertices(24, 8, 32, 16)
    )
    headBox.rotateY(Math.PI)
    const headMesh = new THREE.Mesh(headBox, layer1Material)
    const head2Box = new THREE.BoxGeometry(9, 9, 9, 0, 0, 0)
    setVertices(
      head2Box,
      toSkinVertices(40, 0, 48, 8),
      toSkinVertices(48, 0, 56, 8),
      toSkinVertices(32, 8, 40, 16),
      toSkinVertices(40, 8, 48, 16),
      toSkinVertices(48, 8, 56, 16),
      toSkinVertices(56, 8, 64, 16)
    )
    head2Box.rotateY(Math.PI)
    const head2Mesh = new THREE.Mesh(head2Box, layer2Material)
    head2Mesh.renderOrder = -1
    headMesh.position.setY(3)
    this.head = new BodyPart(headMesh, head2Mesh)
    this.head.name = 'head'
    this.head.add(headMesh, head2Mesh)
    this.head.rotation.order = 'YXZ'
    this.head.position.setY(-3)
    this.add(this.head)

    // Body
    const bodyBox = new THREE.BoxGeometry(8, 12, 4, 0, 0, 0)
    setVertices(
      bodyBox,
      toSkinVertices(20, 16, 28, 20),
      toSkinVertices(28, 16, 36, 20),
      toSkinVertices(16, 20, 20, 32),
      toSkinVertices(20, 20, 28, 32),
      toSkinVertices(28, 20, 32, 32),
      toSkinVertices(32, 20, 40, 32)
    )
    bodyBox.rotateY(Math.PI)
    const bodyMesh = new THREE.Mesh(bodyBox, layer1Material)
    const body2Box = new THREE.BoxGeometry(9, 13.5, 4.5, 0, 0, 0)
    setVertices(
      body2Box,
      toSkinVertices(20, 32, 28, 36),
      toSkinVertices(28, 32, 36, 36),
      toSkinVertices(16, 36, 20, 48),
      toSkinVertices(20, 36, 28, 48),
      toSkinVertices(28, 36, 32, 48),
      toSkinVertices(32, 36, 40, 48)
    )
    body2Box.rotateY(Math.PI)
    const body2Mesh = new THREE.Mesh(body2Box, layer2Material)
    this.body = new BodyPart(bodyMesh, body2Mesh)
    this.body.name = 'body'
    this.body.add(bodyMesh, body2Mesh)
    this.body.position.y = -10
    this.add(this.body)

    // Right Arm
    const rightArmBox = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0) // w/d/h is model-related
    rightArmBox.rotateY(Math.PI)
    const rightArmMesh = new THREE.Mesh(rightArmBox, layer1Material)
    this.modelListeners.push(() => {
      rightArmMesh.scale.x = (this.slim ? 3 : 4) - esp
      rightArmMesh.scale.y = 12 - esp
      rightArmMesh.scale.z = 4 - esp
      if (this.slim) {
        setVertices(
          rightArmBox,
          toSkinVertices(44, 16, 47, 20),
          toSkinVertices(47, 16, 50, 20),
          toSkinVertices(40, 20, 44, 32),
          toSkinVertices(44, 20, 47, 32),
          toSkinVertices(47, 20, 51, 32),
          toSkinVertices(51, 20, 54, 32)
        )
      } else {
        setVertices(
          rightArmBox,
          toSkinVertices(44, 16, 48, 20),
          toSkinVertices(48, 16, 52, 20),
          toSkinVertices(40, 20, 44, 32),
          toSkinVertices(44, 20, 48, 32),
          toSkinVertices(48, 20, 52, 32),
          toSkinVertices(52, 20, 56, 32)
        )
      }
      rightArmBox.uvsNeedUpdate = true
      rightArmBox.elementsNeedUpdate = true
    })
    const rightArm2Box = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0) // w/d/h is model-related
    rightArm2Box.rotateY(Math.PI)
    const rightArm2Mesh = new THREE.Mesh(rightArm2Box, layer2Material)
    rightArm2Mesh.renderOrder = 1
    this.modelListeners.push(() => {
      rightArm2Mesh.scale.x = (this.slim ? 3.375 : 4.5) - esp
      rightArm2Mesh.scale.y = 13.5 - esp
      rightArm2Mesh.scale.z = 4.5 - esp
      if (this.slim) {
        setVertices(
          rightArm2Box,
          toSkinVertices(44, 32, 47, 36),
          toSkinVertices(47, 32, 50, 36),
          toSkinVertices(40, 36, 44, 48),
          toSkinVertices(44, 36, 47, 48),
          toSkinVertices(47, 36, 51, 48),
          toSkinVertices(51, 36, 54, 48)
        )
      } else {
        setVertices(
          rightArm2Box,
          toSkinVertices(44, 32, 48, 36),
          toSkinVertices(48, 32, 52, 36),
          toSkinVertices(40, 36, 44, 48),
          toSkinVertices(44, 36, 48, 48),
          toSkinVertices(48, 36, 52, 48),
          toSkinVertices(52, 36, 56, 48)
        )
      }
      rightArm2Box.uvsNeedUpdate = true
      rightArm2Box.elementsNeedUpdate = true
    })
    const rightArmPivot = new THREE.Group()
    rightArmPivot.add(rightArmMesh, rightArm2Mesh)
    rightArmPivot.position.y = -6
    this.rightArm = new BodyPart(rightArmMesh, rightArm2Mesh)
    this.rightArm.name = 'rightArm'
    this.rightArm.add(rightArmPivot)
    this.rightArm.position.y = -4
    this.modelListeners.push(() => {
      this.rightArm.position.x = this.slim ? -5.5 : -6
    })
    this.add(this.rightArm)

    // Left Arm
    const leftArmBox = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0) // w/d/h is model-related
    leftArmBox.rotateY(Math.PI)
    const leftArmMesh = new THREE.Mesh(leftArmBox, layer1Material)
    this.modelListeners.push(() => {
      leftArmMesh.scale.x = (this.slim ? 3 : 4) - esp
      leftArmMesh.scale.y = 12 - esp
      leftArmMesh.scale.z = 4 - esp
      if (this.slim) {
        setVertices(
          leftArmBox,
          toSkinVertices(36, 48, 39, 52),
          toSkinVertices(39, 48, 42, 52),
          toSkinVertices(32, 52, 36, 64),
          toSkinVertices(36, 52, 39, 64),
          toSkinVertices(39, 52, 43, 64),
          toSkinVertices(43, 52, 46, 64)
        )
      } else {
        setVertices(
          leftArmBox,
          toSkinVertices(36, 48, 40, 52),
          toSkinVertices(40, 48, 44, 52),
          toSkinVertices(32, 52, 36, 64),
          toSkinVertices(36, 52, 40, 64),
          toSkinVertices(40, 52, 44, 64),
          toSkinVertices(44, 52, 48, 64)
        )
      }
      leftArmBox.uvsNeedUpdate = true
      leftArmBox.elementsNeedUpdate = true
    })
    const leftArm2Box = new THREE.BoxGeometry(1, 1, 1, 0, 0, 0) // w/d/h is model-related
    leftArm2Box.rotateY(Math.PI)
    const leftArm2Mesh = new THREE.Mesh(leftArm2Box, layer2Material)
    leftArm2Mesh.renderOrder = 1
    this.modelListeners.push(() => {
      leftArm2Mesh.scale.x = (this.slim ? 3.375 : 4.5) - esp
      leftArm2Mesh.scale.y = 13.5 - esp
      leftArm2Mesh.scale.z = 4.5 - esp
      if (this.slim) {
        setVertices(
          leftArm2Box,
          toSkinVertices(52, 48, 55, 52),
          toSkinVertices(55, 48, 58, 52),
          toSkinVertices(48, 52, 52, 64),
          toSkinVertices(52, 52, 55, 64),
          toSkinVertices(55, 52, 59, 64),
          toSkinVertices(59, 52, 62, 64)
        )
      } else {
        setVertices(
          leftArm2Box,
          toSkinVertices(52, 48, 56, 52),
          toSkinVertices(56, 48, 60, 52),
          toSkinVertices(48, 52, 52, 64),
          toSkinVertices(52, 52, 56, 64),
          toSkinVertices(56, 52, 60, 64),
          toSkinVertices(60, 52, 64, 64)
        )
      }
      leftArm2Box.uvsNeedUpdate = true
      leftArm2Box.elementsNeedUpdate = true
    })
    const leftArmPivot = new THREE.Group()
    leftArmPivot.add(leftArmMesh, leftArm2Mesh)
    leftArmPivot.position.y = -6
    this.leftArm = new BodyPart(leftArmMesh, leftArm2Mesh)
    this.leftArm.name = 'leftArm'
    this.leftArm.add(leftArmPivot)
    this.leftArm.position.y = -4
    this.modelListeners.push(() => {
      this.leftArm.position.x = this.slim ? 5.5 : 6
    })
    this.add(this.leftArm)

    // Right Leg
    const rightLegBox = new THREE.BoxGeometry(
      4 - esp,
      12 - esp,
      4 - esp,
      0,
      0,
      0
    )
    setVertices(
      rightLegBox,
      toSkinVertices(4, 16, 8, 20),
      toSkinVertices(8, 16, 12, 20),
      toSkinVertices(0, 20, 4, 32),
      toSkinVertices(4, 20, 8, 32),
      toSkinVertices(8, 20, 12, 32),
      toSkinVertices(12, 20, 16, 32)
    )
    rightLegBox.rotateY(Math.PI)
    const rightLegMesh = new THREE.Mesh(rightLegBox, layer1Material)
    const rightLeg2Box = new THREE.BoxGeometry(
      4.5 - esp,
      13.5 - esp,
      4.5 - esp,
      0,
      0,
      0
    )
    setVertices(
      rightLeg2Box,
      toSkinVertices(4, 32, 8, 36),
      toSkinVertices(8, 32, 12, 36),
      toSkinVertices(0, 36, 4, 48),
      toSkinVertices(4, 36, 8, 48),
      toSkinVertices(8, 36, 12, 48),
      toSkinVertices(12, 36, 16, 48)
    )
    rightLeg2Box.rotateY(Math.PI)
    const rightLeg2Mesh = new THREE.Mesh(rightLeg2Box, layer2Material)
    rightLeg2Mesh.renderOrder = 1
    const rightLegPivot = new THREE.Group()
    rightLegPivot.add(rightLegMesh, rightLeg2Mesh)
    rightLegPivot.position.y = -6
    this.rightLeg = new BodyPart(rightLegMesh, rightLeg2Mesh)
    this.rightLeg.name = 'rightLeg'
    this.rightLeg.add(rightLegPivot)
    this.rightLeg.position.y = -16
    this.rightLeg.position.x = -2
    this.add(this.rightLeg)

    // Left Leg
    const leftLegBox = new THREE.BoxGeometry(
      4 - esp,
      12 - esp,
      4 - esp,
      0,
      0,
      0
    )
    setVertices(
      leftLegBox,
      toSkinVertices(20, 48, 24, 52),
      toSkinVertices(24, 48, 28, 52),
      toSkinVertices(16, 52, 20, 64),
      toSkinVertices(20, 52, 24, 64),
      toSkinVertices(24, 52, 28, 64),
      toSkinVertices(28, 52, 32, 64)
    )
    leftLegBox.rotateY(Math.PI)
    const leftLegMesh = new THREE.Mesh(leftLegBox, layer1Material)
    const leftLeg2Box = new THREE.BoxGeometry(
      4.5 - esp,
      13.5 - esp,
      4.5 - esp,
      0,
      0,
      0
    )
    setVertices(
      leftLeg2Box,
      toSkinVertices(4, 48, 8, 52),
      toSkinVertices(8, 48, 12, 52),
      toSkinVertices(0, 52, 4, 64),
      toSkinVertices(4, 52, 8, 64),
      toSkinVertices(8, 52, 12, 64),
      toSkinVertices(12, 52, 16, 64)
    )
    leftLeg2Box.rotateY(Math.PI)
    const leftLeg2Mesh = new THREE.Mesh(leftLeg2Box, layer2Material)
    leftLeg2Mesh.renderOrder = 1
    const leftLegPivot = new THREE.Group()
    leftLegPivot.add(leftLegMesh, leftLeg2Mesh)
    leftLegPivot.position.y = -6
    this.leftLeg = new BodyPart(leftLegMesh, leftLeg2Mesh)
    this.leftLeg.name = 'leftLeg'
    this.leftLeg.add(leftLegPivot)
    this.leftLeg.position.y = -16
    this.leftLeg.position.x = 2
    this.add(this.leftLeg)
    this.slim = false
  }

  get slim() {
    return this._slim
  }

  set slim(value) {
    this._slim = value
    this.modelListeners.forEach(listener => listener())
  }

  getBodyParts() {
    return this.children.filter(it => it instanceof BodyPart)
  }

  setInnerLayerVisible(value) {
    this.getBodyParts().forEach(part => (part.innerLayer.visible = value))
  }

  setOuterLayerVisible(value) {
    this.getBodyParts().forEach(part => (part.outerLayer.visible = value))
  }

  setVisible(visible) {
    this.visible = visible
  }
}

export default class PlayerObject extends THREE.Group {
  constructor(skinImg, pos, dir, gamemode, visible = true) {
    super()

    this.skinImg = new Image()

    this.skinCanvas = document.createElement('canvas')
    this.skinTexture = new THREE.Texture(this.skinCanvas)
    this.skinTexture.magFilter = THREE.NearestFilter
    this.skinTexture.minFilter = THREE.NearestFilter

    const layer1Material = new THREE.MeshLambertMaterial({
      map: this.skinTexture,
      side: THREE.FrontSide
    })
    const layer2Material = new THREE.MeshLambertMaterial({
      map: this.skinTexture,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      alphaTest: 0.3
    })

    this.skin = new SkinObject(layer1Material, layer2Material)
    this.add(this.skin)

    this.skinImg.crossOrigin = 'anonymous'
    this.skinImg.onerror = () =>
      Helpers.error(`Failed loading ${this.skinImg.src}`, true)
    this.skinImg.onload = () => {
      loadSkinToCanvas(this.skinCanvas, this.skinImg)

      if (this.detectModel) {
        this.playerObject.skin.slim = isSlimSkin(this.skinCanvas)
      }

      this.skinTexture.needsUpdate = true
      layer1Material.needsUpdate = true
      layer2Material.needsUpdate = true

      this.skin.visible = true
    }

    this.skinImg.src = skinImg

    this.scale.set(HEIGHT, HEIGHT, HEIGHT)

    this.position.copy(pos.multiplyScalar(DIMENSION))
    this.position.y += EYE_2_TOE * DIMENSION
    this.skin.head.rotation.x = dir.x
    this.rotation.y = dir.y

    this.oldDirY = dir.y

    this.visible = visible
    this.skin.setVisible(visible)
    this.materials = [layer1Material, layer2Material]

    this.setGamemode(gamemode)
  }

  setPosition = (x, y, z) =>
    this.position.set(x * DIMENSION, (y + EYE_2_TOE) * DIMENSION, z * DIMENSION)

  setDirection = (dirx, diry) => {
    this.skin.head.rotation.x = dirx
    this.rotation.y = diry
  }

  tweenPosition = (x, y, z) => {
    new TWEEN.Tween(this.position)
      .to(
        { x: x * DIMENSION, y: (y + EYE_2_TOE) * DIMENSION, z: z * DIMENSION },
        90
      )
      .start()
  }

  tweenDirection = (dirx, diry) => {
    const { head } = this.skin
    // HORIZONTAL DIRECTION CHANGE

    // const headY = head.rotation.y % (Math.PI * 2)
    // const deltaDirY = diry - this.oldDirY

    // if (deltaDirY >= 0) this.stuckRight = false
    // if (deltaDirY <= 0) this.stuckLeft = false

    // // if (deltaDirY !== 0) {
    // //   if ((this.stuckRight && deltaDirY < 0) || (this.stuckLeft && deltaDirY > 0)) {
    // //     new TWEEN.Tween(this.rotation).to({ y: this.rotation.y + deltaDirY }, 90).start()
    // //   } else if (headY + deltaDirY > HEAD_BODY_DEG) {
    // //     console.log('stuckLeft', headY)
    // //     if (headY < HEAD_BODY_DEG)
    // //       new TWEEN.Tween(head.rotation).to({ y: HEAD_BODY_DEG }, 90).start()
    // //     new TWEEN.Tween(this.rotation)
    // //       .to({ y: this.rotation.y + deltaDirY - HEAD_BODY_DEG }, 90)
    // //       .start()
    // //     this.stuckLeft = true
    // //   } else if (headY + deltaDirY < -HEAD_BODY_DEG) {
    // //     console.log('stuckRight', headY)
    // //     if (headY > -HEAD_BODY_DEG)
    // //       new TWEEN.Tween(head.rotation).to({ y: -HEAD_BODY_DEG }, 90).start()
    // //     new TWEEN.Tween(this.rotation)
    // //       .to({ y: this.rotation.y + deltaDirY - HEAD_BODY_DEG }, 90)
    // //       .start()
    // //     this.stuckRight = true
    // //   } else {
    // //     new TWEEN.Tween(head.rotation).to({ y: diry % (Math.PI * 2) }, 90).start()
    // //   }
    // // }

    // VERTICAL DIRECTION CHANGE
    new TWEEN.Tween(head.rotation).to({ x: dirx }, 90).start()
    new TWEEN.Tween(this.rotation).to({ y: diry }, 90).start()
  }

  // setDirection = (x, y) => {
  //   this.skin.head.rotation.x = x
  //   this.skin.head.rotation.y = y
  // }

  getLookingDirection = () => this.skin.head.rotation

  setVisible = visible => this.skin.setVisible(visible)

  setGamemode = gamemode => {
    switch (gamemode) {
      case 'SURVIVAL':
      case 'CREATIVE': {
        this.materials.forEach(m => {
          m.opacity = 1
          m.needsUpdate = true
        })
        this.skin.getBodyParts().forEach(bp => (bp.visible = true))
        this.materials[0].transparent = false
        this.materials[0].depthTest = true
        break
      }
      case 'SPECTATOR': {
        this.skin.getBodyParts().forEach(bp => (bp.visible = false))
        this.skin.head.visible = true
        this.materials.forEach(m => {
          m.opacity = 0.5
          m.needsUpdate = true
        })
        this.materials[0].transparent = true
        this.materials[0].depthTest = false
        break
      }
      default:
        break
    }
  }
}
