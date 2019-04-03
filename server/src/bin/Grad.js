class Grad {
	constructor(x, y, z) {
		this.x = x
		this.y = y
		this.z = z
	}

	dot2 = (x, y) => {
		return this.x * x + this.y * y
	}

	dot3 = (x, y, z) => {
		return this.x * x + this.y * y + this.z * z
	}
}

export default Grad
