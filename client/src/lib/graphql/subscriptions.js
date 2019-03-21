import gql from 'graphql-tag'

export const CHUNK_SUBSCRIPTION = gql`
	subscription chunk($worldId: ID!) {
		chunk(worldId: "cjtira7rf07im07705aea3jyd") {
			mutation
			node {
				blocks
				coordx
				coordz
			}
		}
	}
`
