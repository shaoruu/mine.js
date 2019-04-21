import * as THREE from 'three'

class MaterialManager {
	constructor() {
		this.loader = new THREE.TextureLoader()

		this.materials = {}
		this.images = {}
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
		this.images[id] = {}
		this.materials[id] = {}

		for (let key in sources) {
			const texture = this.loader.load(sources[key])
			texture.wrapS = THREE.RepeatWrapping
			texture.wrapT = THREE.RepeatWrapping
			texture.magFilter = THREE.NearestFilter
			texture.minFilter = THREE.NearestMipMapLinearFilter

			var material = new THREE.MeshLambertMaterial({
				map: texture,
				side: THREE.DoubleSide
			})

			this.images[id][key] = sources[key]
			this.materials[id][key] = material
		}
	}

	get = id => this.materials[id]
	getImage = id => this.images[id]
}

export default MaterialManager
