import React from 'react'
import { Query } from 'react-apollo'
import { withRouter } from 'react-router-dom'

import { MY_WORLDS_QUERY } from '../../../lib/graphql'
import WorldList from './WorldList/WorldList'
import CreateNewWorld from './Buttons/CreateNewWorld/CreateNewWorld'
import { Loading } from '../../Utils'

const Worlds = withRouter(({ history, subpage }) => {
	return (
		<Query query={MY_WORLDS_QUERY} onError={err => console.log(err)}>
			{({ loading, data }) => {
				if (loading) return <Loading />

				const { myWorlds } = data

				let render = null
				switch (subpage) {
					case 'create':
						render = <CreateNewWorld />
						break
					default:
						render = (
							<div>
								<WorldList data={myWorlds} />
								<button
									onClick={() => history.push('/game/worlds/create')}>
									Create New World
								</button>
							</div>
						)
				}

				return render
			}}
		</Query>
	)
})

export { Worlds }
