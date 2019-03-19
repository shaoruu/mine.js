/**
 * HOME PAGE
 * - REPRESENTS: LAUNCHER HOME
 */

import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

class Home extends Component {
	render() {
		const { isAuth, history } = this.props

		const content = isAuth ? (
			<div>
				<button onClick={() => history.push('/game')}>Game</button>
				<button onClick={() => history.push('/settings')}>Settings</button>
				<button onClick={() => history.push('/logout')}>Logout</button>
			</div>
		) : (
			<div>
				<button onClick={() => history.push('/login')}>Login</button>
				<button onClick={() => history.push('/register')}>Register</button>
			</div>
		)

		return (
			<div>
				<h1>Minecraft</h1>
				{content}
			</div>
		)
	}
}

export default withAuthGuard(withRouter(Home))
