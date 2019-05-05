import * as THREE from 'three'

import Resources from '../Resources'
import Config from '../../Config'

const dimension = Config.block.dimension
const rBlock = Resources.geometries.block

/**
 * // vertices

    for ( var i = 0, il = vertices2.length; i < il; i ++ ) {

        var vertex = vertices2[ i ];

        var vertexCopy = vertex.clone();

        if ( matrix !== undefined ) vertexCopy.applyMatrix4( matrix );

        vertices1.push( vertexCopy );

    }

    // colors

    for ( var i = 0, il = colors2.length; i < il; i ++ ) {

        colors1.push( colors2[ i ].clone() );

    }

    // faces

    for ( i = 0, il = faces2.length; i < il; i ++ ) {

        var face = faces2[ i ], faceCopy, normal, color,
            faceVertexNormals = face.vertexNormals,
            faceVertexColors = face.vertexColors;

        faceCopy = new Face3( face.a + vertexOffset, face.b + vertexOffset, face.c + vertexOffset );
        faceCopy.normal.copy( face.normal );

        if ( normalMatrix !== undefined ) {

            faceCopy.normal.applyMatrix3( normalMatrix ).normalize();

        }

        for ( var j = 0, jl = faceVertexNormals.length; j < jl; j ++ ) {

            normal = faceVertexNormals[ j ].clone();

            if ( normalMatrix !== undefined ) {

                normal.applyMatrix3( normalMatrix ).normalize();

            }

            faceCopy.vertexNormals.push( normal );

        }

        faceCopy.color.copy( face.color );

        for ( var j = 0, jl = faceVertexColors.length; j < jl; j ++ ) {

            color = faceVertexColors[ j ];
            faceCopy.vertexColors.push( color.clone() );

        }

        faceCopy.materialIndex = face.materialIndex + materialIndexOffset;

        faces1.push( faceCopy );

    }

    // uvs

    for ( i = 0, il = uvs2.length; i < il; i ++ ) {

        var uv = uvs2[ i ], uvCopy = [];

        if ( uv === undefined ) {

            continue;

        }

        for ( var j = 0, jl = uv.length; j < jl; j ++ ) {

            uvCopy.push( uv[ j ].clone() );

        }

        uvs1.push( uvCopy );

    }
 */

class BlockGeometryManager {
	constructor() {
		this.geometries = {}
	}

	load = () => {
		for (let key in rBlock) {
			this.geometries[key] = new THREE.PlaneGeometry(dimension, dimension)
			const { func, rotation } = rBlock[key]
			if (func) this.geometries[key][func](rotation)
		}
		console.log(this.geometries.px)
	}

	get = key => this.geometries[key]
}

export default BlockGeometryManager
