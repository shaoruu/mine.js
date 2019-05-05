import React from 'react'
import { Query } from 'react-apollo'
import { withRouter, Redirect } from 'react-router-dom'

import { MY_WORLDS_QUERY } from '../../../lib/graphql'
import WorldList from './WorldList/WorldList'
import CreateNewWorld from './Buttons/CreateNewWorld/CreateNewWorld'
import { Hint } from '../../Utils'

const Worlds = withRouter(({ history, subpage }) => {
	return (
		<Query
			query={MY_WORLDS_QUERY}
			onError={err => console.error(err)}
			fetchPolicy="network-only">
			{({ loading, data }) => {
				if (loading) return <Hint />

				const { myWorlds } = data

				let render = null
				switch (subpage) {
					case 'create':
						render = <CreateNewWorld />
						break
					case undefined:
					case '':
						render = (
							<div>
								<WorldList data={myWorlds} />
								<button
									onClick={() => history.push('/game/worlds/create')}>
									Create New World
								</button>
							</div>
						)
						break
					default:
						render = <Redirect to="/game/worlds" />
						break
				}

				return render
			}}
		</Query>
	)
})

export { Worlds }
