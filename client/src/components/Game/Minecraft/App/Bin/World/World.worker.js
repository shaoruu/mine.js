export default () => {
	/* eslint-disable no-restricted-globals, eslint-disable-line */

	/**
	 * CLASS DECLARATIONS FOR WORKER-SCOPE
	 */
	function Grad(x, y, z) {
		this.x = x
		this.y = y
		this.z = z

		this.dot2 = (x, y) => {
			return this.x * x + this.y * y
		}

		this.dot3 = (x, y, z) => {
			return this.x * x + this.y * y + this.z * z
		}
	}
	function Noise(seed) {
		this.grad3 = [
			new Grad(1, 1, 0),
			new Grad(-1, 1, 0),
			new Grad(1, -1, 0),
			new Grad(-1, -1, 0),
			new Grad(1, 0, 1),
			new Grad(-1, 0, 1),
			new Grad(1, 0, -1),
			new Grad(-1, 0, -1),
			new Grad(0, 1, 1),
			new Grad(0, -1, 1),
			new Grad(0, 1, -1),
			new Grad(0, -1, -1)
		]

		// prettier-ignore
		this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
            23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
            174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
            133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
            89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
            202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
            248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
            178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
            14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
            93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]

		this.perm = new Array(512)
		this.gradP = new Array(512)

		this.F2 = 0.5 * (Math.sqrt(3) - 1)
		this.G2 = (3 - Math.sqrt(3)) / 6

		this.F3 = 1 / 3
		this.G3 = 1 / 6

		// This isn't a very good seeding function, but it works ok. It supports 2^16
		// different seed values. Write something better if you need more seeds.
		this.seed = seed => {
			if (seed > 0 && seed < 1) {
				// Scale the seed out
				seed *= 65536
			}

			seed = Math.floor(seed)
			if (seed < 256) {
				seed |= seed << 8
			}

			for (var i = 0; i < 256; i++) {
				var v
				if (i & 1) {
					v = this.p[i] ^ (seed & 255)
				} else {
					v = this.p[i] ^ ((seed >> 8) & 255)
				}

				this.perm[i] = this.perm[i + 256] = v
				this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12]
			}
		}

		this.seed(seed)

		/*
        for(var i=0; i<256; i++) {
          perm[i] = perm[i + 256] = p[i];
          gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
        }*/

		// Skewing and unskewing factors for 2, 3, and 4 dimensions

		// 2D simplex noise
		this.simplex2 = (xin, yin) => {
			var n0, n1, n2 // Noise contributions from the three corners
			// Skew the input space to determine which simplex cell we're in
			var s = (xin + yin) * this.F2 // Hairy factor for 2D
			var i = Math.floor(xin + s)
			var j = Math.floor(yin + s)
			var t = (i + j) * this.G2
			var x0 = xin - i + t // The x,y distances from the cell origin, unskewed.
			var y0 = yin - j + t
			// For the 2D case, the simplex shape is an equilateral triangle.
			// Determine which simplex we are in.
			var i1, j1 // Offsets for second (middle) corner of simplex in (i,j) coords
			if (x0 > y0) {
				// lower triangle, XY order: (0,0)->(1,0)->(1,1)
				i1 = 1
				j1 = 0
			} else {
				// upper triangle, YX order: (0,0)->(0,1)->(1,1)
				i1 = 0
				j1 = 1
			}
			// A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
			// a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
			// c = (3-sqrt(3))/6
			var x1 = x0 - i1 + this.G2 // Offsets for middle corner in (x,y) unskewed coords
			var y1 = y0 - j1 + this.G2
			var x2 = x0 - 1 + 2 * this.G2 // Offsets for last corner in (x,y) unskewed coords
			var y2 = y0 - 1 + 2 * this.G2
			// Work out the hashed gradient indices of the three simplex corners
			i &= 255
			j &= 255
			var gi0 = this.gradP[i + this.perm[j]]
			var gi1 = this.gradP[i + i1 + this.perm[j + j1]]
			var gi2 = this.gradP[i + 1 + this.perm[j + 1]]
			// Calculate the contribution from the three corners
			var t0 = 0.5 - x0 * x0 - y0 * y0
			if (t0 < 0) {
				n0 = 0
			} else {
				t0 *= t0
				n0 = t0 * t0 * gi0.dot2(x0, y0) // (x,y) of grad3 used for 2D gradient
			}
			var t1 = 0.5 - x1 * x1 - y1 * y1
			if (t1 < 0) {
				n1 = 0
			} else {
				t1 *= t1
				n1 = t1 * t1 * gi1.dot2(x1, y1)
			}
			var t2 = 0.5 - x2 * x2 - y2 * y2
			if (t2 < 0) {
				n2 = 0
			} else {
				t2 *= t2
				n2 = t2 * t2 * gi2.dot2(x2, y2)
			}
			// Add contributions from each corner to get the final noise value.
			// The result is scaled to return values in the interval [-1,1].
			return 70 * (n0 + n1 + n2)
		}

		// 3D simplex noise
		this.simplex3 = (xin, yin, zin) => {
			var n0, n1, n2, n3 // Noise contributions from the four corners

			// Skew the input space to determine which simplex cell we're in
			var s = (xin + yin + zin) * this.F3 // Hairy factor for 2D
			var i = Math.floor(xin + s)
			var j = Math.floor(yin + s)
			var k = Math.floor(zin + s)

			var t = (i + j + k) * this.G3
			var x0 = xin - i + t // The x,y distances from the cell origin, unskewed.
			var y0 = yin - j + t
			var z0 = zin - k + t

			// For the 3D case, the simplex shape is a slightly irregular tetrahedron.
			// Determine which simplex we are in.
			var i1, j1, k1 // Offsets for second corner of simplex in (i,j,k) coords
			var i2, j2, k2 // Offsets for third corner of simplex in (i,j,k) coords
			if (x0 >= y0) {
				if (y0 >= z0) {
					i1 = 1
					j1 = 0
					k1 = 0
					i2 = 1
					j2 = 1
					k2 = 0
				} else if (x0 >= z0) {
					i1 = 1
					j1 = 0
					k1 = 0
					i2 = 1
					j2 = 0
					k2 = 1
				} else {
					i1 = 0
					j1 = 0
					k1 = 1
					i2 = 1
					j2 = 0
					k2 = 1
				}
			} else {
				if (y0 < z0) {
					i1 = 0
					j1 = 0
					k1 = 1
					i2 = 0
					j2 = 1
					k2 = 1
				} else if (x0 < z0) {
					i1 = 0
					j1 = 1
					k1 = 0
					i2 = 0
					j2 = 1
					k2 = 1
				} else {
					i1 = 0
					j1 = 1
					k1 = 0
					i2 = 1
					j2 = 1
					k2 = 0
				}
			}
			// A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
			// a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
			// a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
			// c = 1/6.
			var x1 = x0 - i1 + this.G3 // Offsets for second corner
			var y1 = y0 - j1 + this.G3
			var z1 = z0 - k1 + this.G3

			var x2 = x0 - i2 + 2 * this.G3 // Offsets for third corner
			var y2 = y0 - j2 + 2 * this.G3
			var z2 = z0 - k2 + 2 * this.G3

			var x3 = x0 - 1 + 3 * this.G3 // Offsets for fourth corner
			var y3 = y0 - 1 + 3 * this.G3
			var z3 = z0 - 1 + 3 * this.G3

			// Work out the hashed gradient indices of the four simplex corners
			i &= 255
			j &= 255
			k &= 255
			var gi0 = this.gradP[i + this.perm[j + this.perm[k]]]
			var gi1 = this.gradP[i + i1 + this.perm[j + j1 + this.perm[k + k1]]]
			var gi2 = this.gradP[i + i2 + this.perm[j + j2 + this.perm[k + k2]]]
			var gi3 = this.gradP[i + 1 + this.perm[j + 1 + this.perm[k + 1]]]

			// Calculate the contribution from the four corners
			var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
			if (t0 < 0) {
				n0 = 0
			} else {
				t0 *= t0
				n0 = t0 * t0 * gi0.dot3(x0, y0, z0) // (x,y) of grad3 used for 2D gradient
			}
			var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
			if (t1 < 0) {
				n1 = 0
			} else {
				t1 *= t1
				n1 = t1 * t1 * gi1.dot3(x1, y1, z1)
			}
			var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
			if (t2 < 0) {
				n2 = 0
			} else {
				t2 *= t2
				n2 = t2 * t2 * gi2.dot3(x2, y2, z2)
			}
			var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
			if (t3 < 0) {
				n3 = 0
			} else {
				t3 *= t3
				n3 = t3 * t3 * gi3.dot3(x3, y3, z3)
			}
			// Add contributions from each corner to get the final noise value.
			// The result is scaled to return values in the interval [-1,1].
			return 32 * (n0 + n1 + n2 + n3)
		}

		// ##### Perlin noise stuff

		this.fade = t => {
			return t * t * t * (t * (t * 6 - 15) + 10)
		}

		this.lerp = (a, b, t) => {
			return (1 - t) * a + t * b
		}

		// 2D Perlin Noise
		this.perlin2 = (x, y) => {
			// Find unit grid cell containing point
			var X = Math.floor(x),
				Y = Math.floor(y)
			// Get relative xy coordinates of point within that cell
			x = x - X
			y = y - Y
			// Wrap the integer cells at 255 (smaller integer period can be introduced here)
			X = X & 255
			Y = Y & 255

			// Calculate noise contributions from each of the four corners
			var n00 = this.gradP[X + this.perm[Y]].dot2(x, y)
			var n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1)
			var n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y)
			var n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1)

			// Compute the fade curve value for x
			var u = this.fade(x)

			// Interpolate the four results
			return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y))
		}

		// 3D Perlin Noise
		this.perlin3 = (x, y, z) => {
			// Find unit grid cell containing point
			var X = Math.floor(x),
				Y = Math.floor(y),
				Z = Math.floor(z)
			// Get relative xyz coordinates of point within that cell
			x = x - X
			y = y - Y
			z = z - Z
			// Wrap the integer cells at 255 (smaller integer period can be introduced here)
			X = X & 255
			Y = Y & 255
			Z = Z & 255

			// Calculate noise contributions from each of the eight corners
			var n000 = this.gradP[X + this.perm[Y + this.perm[Z]]].dot3(x, y, z)
			var n001 = this.gradP[X + this.perm[Y + this.perm[Z + 1]]].dot3(x, y, z - 1)
			var n010 = this.gradP[X + this.perm[Y + 1 + this.perm[Z]]].dot3(x, y - 1, z)
			var n011 = this.gradP[X + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
				x,
				y - 1,
				z - 1
			)
			var n100 = this.gradP[X + 1 + this.perm[Y + this.perm[Z]]].dot3(x - 1, y, z)
			var n101 = this.gradP[X + 1 + this.perm[Y + this.perm[Z + 1]]].dot3(
				x - 1,
				y,
				z - 1
			)
			var n110 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z]]].dot3(
				x - 1,
				y - 1,
				z
			)
			var n111 = this.gradP[X + 1 + this.perm[Y + 1 + this.perm[Z + 1]]].dot3(
				x - 1,
				y - 1,
				z - 1
			)

			// Compute the fade curve value for x, y, z
			var u = this.fade(x)
			var v = this.fade(y)
			var w = this.fade(z)

			// Interpolate
			return this.lerp(
				this.lerp(this.lerp(n000, n100, u), this.lerp(n001, n101, u), w),
				this.lerp(this.lerp(n010, n110, u), this.lerp(n011, n111, u), w),
				v
			)
		}
	}
	function getCoordsRepresentation(x, y, z, semi = false) {
		return `${x}:${y}:${z}${semi ? ';' : ''}`
	}
	function Generator(seed, noiseConstant, height) {
		this.noise = new Noise(seed)

		this.getBlockInfo = (x, y, z, solid = false) => {
			let blockId = 0
			if (y <= height / 2) {
				blockId = 1
			} else {
				let x2 = x / noiseConstant
				let y2 = y / noiseConstant
				let z2 = z / noiseConstant

				let value = this.linearInterpolate3d(
					this.getNoise(x2, y2, z2),
					this.getNoise(x2 + 1 / noiseConstant, y2, z2),
					this.getNoise(x2, y2 + 1 / noiseConstant, z2),
					this.getNoise(x2 + 1 / noiseConstant, y2 + 1 / noiseConstant, z2),
					this.getNoise(x2, y2, z2 + 1 / noiseConstant),
					this.getNoise(x2 + 1 / noiseConstant, y2, z2 + 1 / noiseConstant),
					this.getNoise(x2, y2 + 1 / noiseConstant, z2 + 1 / noiseConstant),
					this.getNoise(
						x2 + 1 / noiseConstant,
						y2 + 1 / noiseConstant,
						z2 + 1 / noiseConstant
					),
					x2,
					y2,
					z2
				)
				if (value >= -0.5) {
					blockId = 1
				}
			}
			if (!solid && blockId === 1) {
				if (y === height || this.getBlockInfo(x, y + 1, z, true) === 0) {
					blockId = 2
				} else if (
					y >= height - 3 ||
					this.getBlockInfo(x, y + 4, z, true) === 0 ||
					this.getBlockInfo(x, y + 3, z, true) === 0 ||
					this.getBlockInfo(x, y + 2, z, true) === 0
				) {
					blockId = 3
				}
			}
			return blockId
		}

		this.linearInterpolate3d = (
			xm_ym_zm,
			xp_ym_zm,
			xm_yp_zm,
			xp_yp_zm,
			xm_ym_zp,
			xp_ym_zp,
			xm_yp_zp,
			xp_yp_zp,
			x,
			y,
			z
		) =>
			xm_ym_zm * (1 - x) * (1 - y) * (1 - z) +
			xp_ym_zm * x * (1 - y) * (1 - z) +
			xm_yp_zm * (1 - x) * y * (1 - z) +
			xp_yp_zm * x * y * (1 - z) +
			xm_ym_zp * (1 - x) * (1 - y) * z +
			xp_ym_zp * x * (1 - y) * z +
			xm_yp_zp * (1 - x) * y * z +
			xp_yp_zp * x * y * z

		this.getNoise = (x, y, z) =>
			this.noise.perlin3(x, y, z) - (y * noiseConstant * 2) / height + 1
	}

	self.addEventListener('message', e => {
		if (!e) return

		const { ACTION } = e.data
		if (!ACTION) throw new Error('Action not specified.')

		switch (ACTION) {
			case 'GEN_BLOCKS': {
				const {
					seed,
					changedBlocks,
					configs: { noiseConstant, size, height },
					coords: { coordx, coordy, coordz }
				} = e.data

				const generator = new Generator(seed, noiseConstant, height)
				const blocks = []

				for (let x = 0; x < size; x++)
					for (let z = 0; z < size; z++)
						for (let y = 0; y < size; y++) {
							blocks.push({
								position: {
									x,
									y,
									z
								},
								id:
									changedBlocks[
										getCoordsRepresentation(
											coordx * size + x,
											coordy * size + y,
											coordz * size + z
										)
									] ||
									generator.getBlockInfo(
										coordx * size + x,
										coordy * size + y,
										coordz * size + z
									)
							})
						}

				postMessage({ ACTION, coords: { coordx, coordy, coordz }, blocks })
				break
			}
			case 'GEN_QUADS': {
				/**
				 * COLLECTING DATA TO PROCESS
				 */
				const { size, volume, chunkName } = e.data
				const dims = [size, size, size]

				/**
				 * INTERNAL FUNCTIONS FOR CONVENIENCE
				 */
				const f = (i, j, k) => {
					// TODO: FIX THIS DIRTY APPROACH TO ACCESS DATA
					return volume[i * size * size + j * size + k]
				}

				/**
				 * GREEDY!!!!!
				 * --Sweeping over 3-axes--
				 */
				let quads = []
				for (let d = 0; d < 3; ++d) {
					let i,
						j,
						k,
						l,
						w,
						h,
						u = (d + 1) % 3,
						v = (d + 2) % 3,
						x = [0, 0, 0],
						q = [0, 0, 0],
						mask = new Int32Array(dims[u] * dims[v])
					q[d] = 1
					for (x[d] = -1; x[d] < dims[d]; ) {
						//Compute mask
						let n = 0
						for (x[v] = 0; x[v] < dims[v]; ++x[v])
							for (x[u] = 0; x[u] < dims[u]; ++x[u]) {
								/*eslint eqeqeq: ["off"]*/
								mask[n++] =
									(0 <= x[d] ? f(x[0], x[1], x[2]) : false) !=
									(x[d] < dims[d] - 1
										? f(x[0] + q[0], x[1] + q[1], x[2] + q[2])
										: false)
							}
						//Increment x[d]
						++x[d]
						//Generate mesh for mask using lexicographic ordering
						n = 0
						for (j = 0; j < dims[v]; ++j)
							for (i = 0; i < dims[u]; ) {
								if (mask[n]) {
									//Compute width
									for (w = 1; mask[n + w] && i + w < dims[u]; ++w) {}
									//Compute height (this is slightly awkward
									let done = false
									for (h = 1; j + h < dims[v]; ++h) {
										for (k = 0; k < w; ++k) {
											if (!mask[n + k + h * dims[u]]) {
												done = true
												break
											}
										}
										if (done) {
											break
										}
									}
									//Add quad
									x[u] = i
									x[v] = j
									let du = [0, 0, 0]
									du[u] = w
									let dv = [0, 0, 0]
									dv[v] = h
									quads.push([
										[x[0], x[1], x[2]],
										[x[0] + du[0], x[1] + du[1], x[2] + du[2]],
										[
											x[0] + du[0] + dv[0],
											x[1] + du[1] + dv[1],
											x[2] + du[2] + dv[2]
										],
										[x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]],
										mask[n],
										d // axis
									])
									//Zero-out mask
									for (l = 0; l < h; ++l)
										for (k = 0; k < w; ++k) {
											mask[n + k + l * dims[u]] = false
										}
									//Increment counters and continue
									i += w
									n += w
								} else {
									++i
									++n
								}
							}
					}
				}

				/**
				 * POSTING THE RESULTS BACK
				 */
				postMessage({ ACTION, quads, chunkName })
				break
			}
			default:
				break
		}

		// postMessage(a.x)
	})
	/* eslint-enable no-restricted-globals, eslint-disable-line */
}
