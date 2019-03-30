import * as THREE from 'three'

import Config from '../../../../../Data/Config'

class BlockModels {
	constructor() {
		const {
			block: { dimension }
		} = Config

		this.top = new THREE.PlaneGeometry(dimension, dimension)

		this.top.rotateX((Math.PI * 3) / 2)
		this.top.translate(0, dimension / 2, 0)

		this.side0 = new THREE.PlaneGeometry(dimension, dimension)
		this.side0.translate(0, 0, dimension / 2)

		this.side1 = new THREE.PlaneGeometry(dimension, dimension)
		this.side1.rotateY(Math.PI / 2)
		this.side1.translate(dimension / 2, 0, 0)

		this.side2 = new THREE.PlaneGeometry(dimension, dimension)
		this.side2.rotateY(Math.PI)
		this.side2.translate(0, 0, -dimension / 2)

		this.side3 = new THREE.PlaneGeometry(dimension, dimension)
		this.side3.rotateY((Math.PI * 3) / 2)
		this.side3.translate(-dimension / 2, 0, 0)

		this.bottom = new THREE.PlaneGeometry(dimension, dimension)

		this.bottom.rotateX(Math.PI / 2)
		this.bottom.translate(0, -dimension / 2)
	}

	get = () => {
		return {
			topGeo: this.top,
			side0Geo: this.side0,
			side1Geo: this.side1,
			side2Geo: this.side2,
			side3Geo: this.side3,
			bottomGeo: this.bottom
		}
	}
}

export default BlockModels
