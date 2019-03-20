import React, { Component } from 'react'
import { Query } from 'react-apollo'

import { ME_QUERY } from '../../lib/graphql'
// import { signout } from '../../lib/utils'

const withAuthGuard = WrappedComponent => {
	return class extends Component {
		render() {
			return (
				<Query
					query={ME_QUERY}
					onError={error => {
						if (!error.message.includes('Authentication'))
							console.error(error.message)
					}}>
					{({ data, loading, error }) => {
						if (loading) return <WrappedComponent loading={true} />
						if (error) return <WrappedComponent isAuth={false} />

						return (
							<WrappedComponent isAuth={true} username={data.me.username} />
						)
					}}
				</Query>
			)
		}
	}
}

export default withAuthGuard
