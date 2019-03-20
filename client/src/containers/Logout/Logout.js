/**
 * NOT ACTUALLY A PAGE
 * - REPRESENTS: SWITCH ACCOUNT BUTTON
 */

import React, { Component } from 'react'
import { ApolloConsumer } from 'react-apollo'
import { Redirect } from 'react-router-dom'

import { signout } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

class Logout extends Component {
	render() {
		const { isAuth } = this.props

		return (
			<ApolloConsumer>
				{client => {
					if (process.browser) if (isAuth) signout(client)
					return <Redirect to="/login" />
				}}
			</ApolloConsumer>
		)
	}
}

export default withAuthGuard(Logout)
