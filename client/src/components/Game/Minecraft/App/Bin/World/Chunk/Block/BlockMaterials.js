import * as THREE from 'three'

class BlockMaterials {
	constructor() {
		this.loader = new THREE.TextureLoader()

		this.materials = {}
	}

	/**
	 * Sample Sources:
	 * {
	 *  top: require('123'),
	 *  side: require('456'),
	 *  bottom: require('789')
	 * }
	 */
	load = (id, sources) => {
		this.materials[id] = {}
		for (let key in sources) {
			const texture = this.loader.load(sources[key])
			texture.wrapS = THREE.RepeatWrapping
			texture.wrapT = THREE.RepeatWrapping
			texture.magFilter = THREE.NearestFilter
			texture.minFilter = THREE.NearestMipMapLinearFilter
			texture.flipY = true

			var material = new THREE.MeshStandardMaterial({
				map: texture,
				side: THREE.DoubleSide
			})

			this.materials[id][key] = material
		}
	}

	get = id => this.materials[id]
}

export default BlockMaterials
