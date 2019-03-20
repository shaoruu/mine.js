import * as THREE from 'three'

import Config from '../../../../../Data/Config'

/*
top: 0
side: 1-4
bottom: 5
*/

class Block {
	constructor(id, x, y, z) {
		this.position = new THREE.Vector3(x, y, z)

		this.sources = null

		switch (id) {
			case 1:
				this.sources = {
					side: require('./assets/blocks/stone.png'),
					top: require('./assets/blocks/stone.png'),
					bottom: require('./assets/blocks/stone.png')
				}
				break
			case 2:
				this.sources = {
					side: require('./assets/blocks/grass_side.png'),
					top: require('./assets/blocks/grass_top.png'),
					bottom: require('./assets/blocks/dirt.png')
				}
				break
			case 3:
				this.sources = {
					side: require('./assets/blocks/dirt.png'),
					top: require('./assets/blocks/dirt.png'),
					bottom: require('./assets/blocks/dirt.png')
				}
				break
			default:
				this.sources = {
					side: require('./assets/blocks/stone.png'),
					top: require('./assets/blocks/stone.png'),
					bottom: require('./assets/blocks/stone.png')
				}
				break
		}
	}

	getTotalMesh = specifics => {
		const geo = []
		const dimension = Config.block.dimension

		if (specifics.top) {
			const topGeo = new THREE.PlaneGeometry(dimension, dimension)

			let topTexture = new THREE.TextureLoader().load(this.sources.top)
			topTexture.wrapS = THREE.RepeatWrapping
			topTexture.wrapT = THREE.RepeatWrapping
			topTexture.magFilter = THREE.NearestFilter
			topTexture.minFilter = THREE.NearestMipMapLinearFilter

			const topMaterial = new THREE.MeshBasicMaterial({
				map: topTexture,
				side: THREE.DoubleSide
			})

			const topMesh = new THREE.Mesh(topGeo, topMaterial)
			topMesh.rotateX((Math.PI * 3) / 2)
			topMesh.position.x = this.position.x
			topMesh.position.y = this.position.y + dimension / 2
			topMesh.position.z = this.position.z
			geo.push(topMesh)
		}

		if (specifics.bottom) {
			const bottomGeo = new THREE.PlaneGeometry(dimension, dimension)

			let bottomTexture = new THREE.TextureLoader().load(this.sources.bottom)
			bottomTexture.wrapS = THREE.RepeatWrapping
			bottomTexture.wrapT = THREE.RepeatWrapping
			bottomTexture.magFilter = THREE.NearestFilter
			bottomTexture.minFilter = THREE.NearestMipMapLinearFilter

			const bottomMaterial = new THREE.MeshBasicMaterial({
				map: bottomTexture,
				side: THREE.DoubleSide
			})

			const bottomMesh = new THREE.Mesh(bottomGeo, bottomMaterial)
			bottomMesh.rotateX(Math.PI / 2)
			bottomMesh.position.x = this.position.x
			bottomMesh.position.y = this.position.y - dimension / 2
			bottomMesh.position.z = this.position.z
			geo.push(bottomMesh)
		}

		let sideTexture = new THREE.TextureLoader().load(this.sources.side)
		sideTexture.wrapS = THREE.RepeatWrapping
		sideTexture.wrapT = THREE.RepeatWrapping
		sideTexture.magFilter = THREE.NearestFilter
		sideTexture.minFilter = THREE.NearestMipMapLinearFilter

		const sideMaterial = new THREE.MeshBasicMaterial({
			map: sideTexture,
			side: THREE.DoubleSide
		})

		for (let i = 0; i < 4; i++) {
			if (specifics.sides[i]) {
				const sideGeo = new THREE.PlaneGeometry(dimension, dimension)

				const sideMesh = new THREE.Mesh(sideGeo, sideMaterial)

				sideMesh.position.x = this.position.x
				sideMesh.position.y = this.position.y
				sideMesh.position.z = this.position.z

				switch (i) {
					case 0:
						sideMesh.position.z += dimension / 2
						break
					case 1:
						sideMesh.rotateY(Math.PI / 2)
						sideMesh.position.x += dimension / 2
						break
					case 2:
						sideMesh.rotateY(Math.PI)
						sideMesh.position.z -= dimension / 2
						break
					case 3:
						sideMesh.rotateY((Math.PI * 3) / 2)
						sideMesh.position.x -= dimension / 2
						break
					default:
						break
				}

				geo.push(sideMesh)
			}
		}

		return geo
	}
}

export default Block
