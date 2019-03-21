/**
 * HOME PAGE
 * - REPRESENTS: LAUNCHER HOME
 */

import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'

class Home extends Component {
	render() {
		const { isAuth, history, username, loading } = this.props

		if (loading) return <Hint />

		const content = isAuth ? (
			<div>
				<span>{username}</span>
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
