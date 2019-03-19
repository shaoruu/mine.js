import React from 'react'
import { Query } from 'react-apollo'

import { WORLD_QUERY } from '../../../lib/graphql'
import MainScene from './app/MainScene/MainScene'

const Minecraft = ({ id }) => {
	return (
		<Query
			query={WORLD_QUERY}
			variables={{ query: id }}
			onError={error => console.error(error)}>
			{({ loading, data }) => {
				if (loading) return null

				return <MainScene />
			}}
		</Query>
	)
}

export { Minecraft }
