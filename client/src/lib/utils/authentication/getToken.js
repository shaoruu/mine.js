import cookie from 'cookie'

export const getToken = (options = {}) => {
	return cookie.parse(document.cookie, options).token
}
