import React from 'react'
import { Query } from 'react-apollo'

import { WORLD_QUERY } from '../../../lib/graphql'
import MainScene from './App/MainScene/MainScene'

const Minecraft = ({ id, username }) => {
	return (
		<Query
			query={WORLD_QUERY}
			variables={{ query: id }}
			onError={error => console.error(error)}>
			{({ loading, data }) => {
				if (loading) return null

				const { world } = data

				return <MainScene world={world} username={username} />
			}}
		</Query>
	)
}

export { Minecraft }
