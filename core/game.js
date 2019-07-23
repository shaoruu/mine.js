import Config from './config/config'
import { Renderer, Camera, World, Player, Light } from './modules/app'
import { Debug } from './modules/interfaces'

import * as THREE from 'three'

import './utils/setup'

/**
 *
 * MAIN GAME STATE CONTROL CENTER
 *
 * this is where all the game components get together
 * and make sense.
 *
 */

const BACKGROUND_CONFIG = Config.scene.background
const FOG_CONFIG = Config.scene.fog
const DIMENSION = Config.block.dimension
const SIZE = Config.chunk.size
const HORZ_D = Config.player.render.horzD
const VERT_D = Config.player.render.vertD

class Game {
  constructor(data, username, container, canvas, blocker, button, apolloClient) {
    /** PRE-GAME SETUP */
    const { world } = data

    const playerData = world.players.find(ele => ele.user.username === username)

    /** SERVER COMMUNICATION */
    this.apolloClient = apolloClient

    /** THREE SCENE */
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(BACKGROUND_CONFIG.color)
    this.scene.fog = new THREE.Fog(
      FOG_CONFIG.color,
      FOG_CONFIG.near,
      (HORZ_D > VERT_D ? VERT_D : HORZ_D) * SIZE * DIMENSION * 6
    )

    /** THREE RENDERER */
    this.renderer = new Renderer(this.scene, canvas)

    /** THREE CAMERA */
    this.camera = new Camera(this.renderer.threeRenderer)

    /** THREE LIGHTS */
    this.lights = new Light(this.scene)
    this.lights.place('ambient')

    /** GAME COMPONENTS */
    this.world = new World(world, this.scene, playerData.y)
    this.player = new Player(
      apolloClient,
      playerData,
      this.camera.threeCamera,
      this.scene,
      this.world,
      canvas,
      blocker,
      button
    )

    this.world.setPlayer(this.player)

    /** UI SETUP */
    this.debug = new Debug(container, this.player, this.world)

    /* -------------------------------------------------------------------------- */
    /*                                TEST STARTS HERE                               */
    /* -------------------------------------------------------------------------- */
    // const geometry = new THREE.BoxGeometry(DIMENSION, DIMENSION, DIMENSION)
    // // eslint-disable-next-line global-require
    // const cube = new THREE.Mesh(geometry, this.resourceManager.getMaterial(18, 'top'))
    // this.scene.add(cube)
    // if (this.player.getCoordinates().y === Number.MIN_SAFE_INTEGER) this.player.setHeight(0)
    /* -------------------------------------------------------------------------- */
    /*                               TEST ENDS HERE                               */
    /* -------------------------------------------------------------------------- */
  }

  update = () => {
    this.renderScene()
    this.player.update()
    this.world.update()
    this.debug.update()
  }

  onWindowResize = () => {
    this.renderer.updateSize()
    this.camera.updateSize(this.renderer.threeRenderer)
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */
  renderScene = () => {
    this.renderer.render(this.scene, this.camera.threeCamera)
  }
}

export default Game
