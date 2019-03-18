import cookie from 'cookie'

export const signout = apolloClient => {
	document.cookie = cookie.serialize('token', '', {
		maxAge: -1 // Expire the cookie immediately
	})

	// Forece a reload of all the current queries now that user is
	// logged in, so we don't accidentally leave any state around.
	apolloClient.cache.reset()
}
