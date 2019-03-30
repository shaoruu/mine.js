import gql from 'graphql-tag'

export const CHUNK_SUBSCRIPTION = gql`
	subscription chunk($worldId: ID!) {
		chunk(worldId: $worldId) {
			mutation
			node {
				blocks
				coordx
				coordz
			}
		}
	}
`
