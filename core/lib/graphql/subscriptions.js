import gql from 'graphql-tag'

export const MESSAGE_SUBSCRIPTION = gql`
  subscription Message($worldId: ID!) {
    message(worldId: $worldId) {
      mutation
      node {
        type
        sender
        body
      }
    }
  }
`

export const PLAYER_SUBSCRIPTION = gql`
  subscription Player($username: String!, $worldId: ID!, $updatedFields_contains_some: [String!]) {
    player(
      username: $username
      worldId: $worldId
      updatedFields_contains_some: $updatedFields_contains_some
    ) {
      mutation
      node {
        gamemode
      }
    }
  }
`
