import React, { Component } from 'react'
import { Mutation, Query } from 'react-apollo'
import * as THREE from 'three'

import { Camera, Light, Player, Renderer } from '../Bin'
import classes from './MainScene.module.css'
import World from '../Bin/World/World'
import { UPDATE_PLAYER_MUTATION } from '../../../../../lib/graphql/mutations'
import { WORLD_QUERY } from '../../../../../lib/graphql'
import { Loading } from '../../../../Utils'

class MainScene extends Component {
	constructor(props) {
		super(props)

		this.initPos = null
		this.initDirs = null

		this.prevPos = {}
		this.prevDirs = {}

		this.updatePlayer = null
	}

	handleQueryComplete = () => {
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
			this.initPos,
			this.initDirs
		)

		/** TEST */
		// const geometry = new THREE.BoxGeometry(1, 1, 1)
		// const material = new THREE.MeshBasicMaterial({ color: '#433F81' })
		// this.cube = new THREE.Mesh(geometry, material)
		// this.scene.add(this.cube)
		/** */

		this.init()

		this.updatePosCall = setInterval(() => {
			const playerCoords = this.player.getCoordinates(),
				playerDirs = this.player.getDirections()
			if (
				!(JSON.stringify(playerCoords) === JSON.stringify(this.prevPos)) ||
				!(JSON.stringify(playerDirs) === JSON.stringify(this.prevDirs))
			) {
				this.updatePlayer({
					variables: {
						id: this.currentPlayer.id,
						...playerCoords,
						...playerDirs
					}
				})
				this.prevPos = { ...playerCoords }
				this.prevDirs = { ...playerDirs }
			}
		}, 200)
	}

	componentWillUnmount() {
		this.terminate()
		this.mount.removeChild(this.renderer.threeRenderer.domElement)
		clearInterval(this.updatePosCall)
	}

	init = () => {
		this.world = new World(this.worldData)
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
		const { username, id: worldId } = this.props

		return (
			<Query
				query={WORLD_QUERY}
				variables={{ query: worldId }}
				onError={err => console.error(err)}
				fetchPolicy="network-only"
				onCompleted={() => this.handleQueryComplete()}>
				{({ loading, data }) => {
					if (loading) return <Loading />
					const { world } = data

					this.worldData = world
					this.currentPlayer = world.players.find(
						ele => ele.user.username === username
					)
					this.initPos = {
						x: this.currentPlayer.x,
						y: this.currentPlayer.y,
						z: this.currentPlayer.z
					}
					this.initDirs = {
						dirx: this.currentPlayer.dirx,
						diry: this.currentPlayer.diry
					}

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
				}}
			</Query>
		)
	}
}

export default MainScene
