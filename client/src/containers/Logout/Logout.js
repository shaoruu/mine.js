import React, { Component } from 'react'
import { ApolloConsumer } from 'react-apollo'
import { withRouter } from 'react-router-dom'

import { signout } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

class Logout extends Component {
	render() {
		const { history, isAuth } = this.props

		return (
			<ApolloConsumer>
				{client => {
					if (process.browser) {
						if (isAuth) signout(client)
						history.push('/login')
					}
					return null
				}}
			</ApolloConsumer>
		)
	}
}

export default withAuthGuard(withRouter(Logout))
