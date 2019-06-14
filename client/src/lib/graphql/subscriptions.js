import gql from 'graphql-tag'

export const BLOCK_SUBSCRIPTION = gql`
  subscription Block($worldId: ID!) {
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
  subscription Player($username: String!) {
    player(username: $username) {
      mutation
      node {
        gamemode
      }
    }
  }
`
