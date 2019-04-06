export default () => {
	/* eslint-disable no-restricted-globals, eslint-disable-line */
	self.addEventListener('message', e => {
		if (!e) return

		postMessage(e.data)
	})
	/* eslint-enable no-restricted-globals, eslint-disable-line */
}
