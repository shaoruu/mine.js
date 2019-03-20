import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import * as THREE from 'three'

import { Camera, Light, Player, Renderer } from '../Bin'
import classes from './MainScene.module.css'
import World from '../Bin/World/World'
import { UPDATE_PLAYER_MUTATION } from '../../../../../lib/graphql/mutations'

const initPos = {}

class MainScene extends Component {
	constructor(props) {
		super(props)

		const {
			username,
			world: { players }
		} = props

		const currentPlayer = players.find(ele => ele.user.username === username)

		this.state = {
			playerId: currentPlayer.id
		}

		initPos = { x: currentPlayer.x, y: currentPlayer.y, z: currentPlayer.z }

		this.updatePlayer = null
	}

	componentDidMount() {
		// Main scene creation
		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(0xffffff)
		this.scene.fog = new THREE.Fog(0xffffff, 0, 1000)

		// Main renderer constructor
		this.renderer = new Renderer(this.scene, this.mount)

		// Components instantiations
		this.camera = new Camera(this.renderer.threeRenderer)
		this.light = new Light(this.scene)
		this.light.place('hemi')
		this.light.place('ambient')
		this.light.place('point')

		// Player initialization
		this.player = new Player(
			this.camera.threeCamera,
			this.scene,
			this.mount,
			this.blocker,
			initPos
		)

		/** TEST */
		// const geometry = new THREE.BoxGeometry(1, 1, 1)
		// const material = new THREE.MeshBasicMaterial({ color: '#433F81' })
		// this.cube = new THREE.Mesh(geometry, material)
		// this.scene.add(this.cube)
		/** */

		this.init()

		setInterval(
			() =>
				this.updatePlayer({
					variables: {
						id: this.state.playerId,
						...this.player.getCoordinates()
					}
				}),
			200
		)
	}

	componentWillUnmount() {
		this.terminate()
		this.mount.removeChild(this.renderer.threeRenderer.domElement)
	}

	init = () => {
		const { world } = this.props

		this.world = new World(world)
		this.world.init(this.scene)

		window.addEventListener('resize', this.onWindowResize, false)
		if (!this.frameId) this.frameId = requestAnimationFrame(this.animate)
	}

	terminate = () => {
		cancelAnimationFrame(this.frameId)
	}

	animate = () => {
		this.update()

		this.renderScene()
		this.frameId = window.requestAnimationFrame(this.animate)
	}

	update = () => {
		/** TEST */
		// this.cube.rotation.x += 0.01
		// this.cube.rotation.y += 0.01
		/** */

		this.player.update()
	}

	renderScene = () => {
		this.renderer.render(this.scene, this.camera.threeCamera)
	}

	onWindowResize = () => {
		this.camera.updateSize(this.renderer.threeRenderer)
		this.renderer.updateSize()
	}

	render() {
		return (
			<Mutation
				mutation={UPDATE_PLAYER_MUTATION}
				onError={err => console.error(err)}>
				{updatePlayer => {
					this.updatePlayer = updatePlayer // Hooked updatePlayer for outter usage

					return (
						<div
							style={{ width: '100%', height: '100%' }}
							ref={mount => (this.mount = mount)}>
							<div
								className={classes.blocker}
								ref={blocker => (this.blocker = blocker)}
							/>
						</div>
					)
				}}
			</Mutation>
		)
	}
}

export default MainScene
