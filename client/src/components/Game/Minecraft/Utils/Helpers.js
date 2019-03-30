import * as THREE from 'three'

export default class Helpers {
	static mergeMeshes = (meshes, toBufferGeometry = true) => {
		let finalGeometry,
			materials = [],
			mergedGeometry = new THREE.Geometry(),
			mergedMesh

		meshes.forEach((mesh, index) => {
			mesh.updateMatrix()
			mesh.geometry.faces.forEach(function(face) {
				face.materialIndex = 0
			})
			mergedGeometry.merge(mesh.geometry, mesh.matrix, index)
			materials.push(mesh.material)
		})

		mergedGeometry.groupsNeedUpdate = true

		if (toBufferGeometry) {
			finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)
		} else {
			finalGeometry = mergedGeometry
		}

		mergedMesh = new THREE.Mesh(finalGeometry, materials)
		mergedMesh.geometry.computeFaceNormals()
		mergedMesh.geometry.computeVertexNormals()

		return mergedMesh
	}
	static round(value, decimals) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
	}
	static getChunkRepresentation(x, z, semi = false) {
		return `${x}:${z}${semi ? ';' : ''}`
	}
}
