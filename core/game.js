import Config from './config/config'
import { Renderer, Camera, World, Player } from './modules/app'
import { Debug, ConnectionStatus } from './modules/interfaces'
import IOClient from './lib/ioClient/ioClient'
import { ResourceManager } from './modules/managers'

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

const AUTO_SAVE_INTERVAL = Config.game.autoSaveInterval
const BACKGROUND_CONFIG = Config.scene.background
const FOG_CONFIG = Config.scene.fog
const DIMENSION = Config.block.dimension
const SIZE = Config.chunk.size

class Game {
  constructor(
    data,
    username,
    container,
    canvas,
    blocker,
    button,
    apolloClient
  ) {
    /** PRE-GAME SETUP */
    const { world } = data

    const playerData = world.players.find(ele => ele.user.username === username)
    const RENDER_D = playerData.user.settings.renderDistance

    const resourceManager = new ResourceManager()

    /** LOCAL DATA SAVE */
    this.data = {
      username
    }

    /** SERVER COMMUNICATION */
    this.apolloClient = apolloClient
    this.ioClient = new IOClient()
    this.connectionStatus = new ConnectionStatus(container)

    /** THREE SCENE */
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(BACKGROUND_CONFIG.color)
    this.scene.fog = new THREE.Fog(
      FOG_CONFIG.color,
      FOG_CONFIG.near,
      RENDER_D * SIZE * DIMENSION * 8
    )

    /** THREE RENDERER */
    this.renderer = new Renderer(this.scene, canvas)

    /** THREE CAMERA */
    this.camera = new Camera(this.renderer.threeRenderer, RENDER_D)

    /** GAME COMPONENTS */
    this.world = new World(
      world,
      this.scene,
      apolloClient,
      this.ioClient,
      container,
      playerData,
      resourceManager
    )
    this.player = new Player(
      apolloClient,
      this.ioClient,
      playerData,
      this.camera.threeCamera,
      this.scene,
      this.world,
      canvas,
      blocker,
      button,
      container,
      resourceManager
    )

    this.world.setPlayer(this.player)

    /** UI SETUP */
    this.debug = new Debug(container, this.player, this.world)

    this.init()

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

  init = () => {
    this.world.init()
    this.ioClient.emit('setInfo', {
      worldId: this.world.data.id,
      username: this.data.username
    })

    // AUTO SAVE
    window.requestInterval(this.save, AUTO_SAVE_INTERVAL)
  }

  update = () => {
    this.debug.tickStart()
    this.renderScene()
    this.player.update()
    this.world.update()
    this.debug.tick()
  }

  save = () => {
    this.world.saveApollo()
    this.player.saveApollo()
  }

  onWindowResize = () => {
    this.renderer.updateSize()
    this.camera.updateSize(this.renderer.threeRenderer)
  }

  terminate = () => {
    this.world.terminate()
    this.player.terminate()

    // CLEAR IO CACHE
    this.ioClient.emit('removeInfo', {
      worldId: this.world.data.id,
      username: this.data.username
    })
    this.ioClient.disconnect()

    this.save()
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */
  renderScene = () => {
    this.renderer.render(this.scene, this.camera.threeCamera)
  }
}

export default Game
