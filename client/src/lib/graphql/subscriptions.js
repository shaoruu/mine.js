import gql from 'graphql-tag'

export const BLOCK_SUBSCRIPTION = gql`
	subscription block($worldId: ID!) {
		block(worldId: $worldId) {
			mutation
			node {
				type
				x
				y
				z
			}
		}
	}
`
