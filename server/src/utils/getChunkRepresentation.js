export default (x, z, semi = false) => {
	return `${x}:${z}${semi ? ';' : ''}`
}
