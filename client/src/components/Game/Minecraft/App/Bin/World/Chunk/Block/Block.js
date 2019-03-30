import * as THREE from 'three'

import Config from '../../../../../Data/Config'

/*
top: 0
side: 1-4
bottom: 5
*/

class Block {
	constructor(id, x, y, z) {
		this.id = id
		this.position = new THREE.Vector3(x, y, z)
	}

	getTotalMesh = (specifics, materials) => {
		const geo = []
		const dimension = Config.block.dimension
		const { top, side, bottom } = materials

		// console.time('Block Get Total Mesh')

		if (specifics.top) {
			const topGeo = new THREE.PlaneGeometry(dimension, dimension)

			const topMesh = new THREE.Mesh(topGeo, top)
			topMesh.rotateX((Math.PI * 3) / 2)
			topMesh.position.x = this.position.x
			topMesh.position.y = this.position.y + dimension / 2
			topMesh.position.z = this.position.z
			geo.push(topMesh)
		}

		if (specifics.bottom) {
			const bottomGeo = new THREE.PlaneGeometry(dimension, dimension)

			const bottomMesh = new THREE.Mesh(bottomGeo, bottom)
			bottomMesh.rotateX(Math.PI / 2)
			bottomMesh.position.x = this.position.x
			bottomMesh.position.y = this.position.y - dimension / 2
			bottomMesh.position.z = this.position.z
			geo.push(bottomMesh)
		}

		for (let i = 0; i < 4; i++) {
			if (specifics.sides[i]) {
				const sideGeo = new THREE.PlaneGeometry(dimension, dimension)

				const sideMesh = new THREE.Mesh(sideGeo, side)

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

		// console.timeEnd('Block Get Total Mesh')

		return geo
	}
}

export default Block
