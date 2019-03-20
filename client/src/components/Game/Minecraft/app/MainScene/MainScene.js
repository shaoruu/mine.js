import React, { Component } from 'react'
import * as THREE from 'three'

import { Camera, Light, Player, Renderer } from '../Bin'
import classes from './MainScene.module.css'

class MainScene extends Component {
	constructor(props) {
		super(props)

		const { chunks } = this.props

		this.state = {
			chunks
		}
	}

	componentDidMount() {
		const { chunks } = this.state

		console.log(chunks)

		// Main scene creation
		this.scene = new THREE.Scene()
		this.scene.background = new THREE.Color(0xffffff)
		this.scene.fog = new THREE.Fog(0xffffff, 0, 1000)

		// Main renderer constructor
		this.renderer = new Renderer(this.scene, this.mount)

		// Components instantiations
		this.camera = new Camera(this.renderer.threeRenderer)
		this.light = new Light(this.scene)

		// Player initialization
		this.player = new Player(
			this.camera.threeCamera,
			this.scene,
			this.mount,
			this.blocker
		)

		/** TEST */
		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: '#433F81' })
		this.cube = new THREE.Mesh(geometry, material)
		this.scene.add(this.cube)
		/** */

		this.start()
	}

	componentWillUnmount() {
		this.stop()
		this.mount.removeChild(this.renderer.threeRenderer.domElement)
	}

	start = () => {
		window.addEventListener('resize', this.onWindowResize, false)
		if (!this.frameId) this.frameId = requestAnimationFrame(this.animate)
	}

	stop = () => {
		cancelAnimationFrame(this.frameId)
	}

	animate = () => {
		this.update()

		this.renderScene()
		this.frameId = window.requestAnimationFrame(this.animate)
	}

	update = () => {
		/** TEST */
		this.cube.rotation.x += 0.01
		this.cube.rotation.y += 0.01
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
			<div
				style={{ width: '100%', height: '100%' }}
				ref={mount => (this.mount = mount)}>
				<div
					className={classes.blocker}
					ref={blocker => (this.blocker = blocker)}
				/>
			</div>
		)
	}
}

export default MainScene
