export default (id, position) => {
	const { x, y, z } = position

	return `${id}:${x},${y},${z};`
}
