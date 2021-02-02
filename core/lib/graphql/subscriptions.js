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
  subscription Player($playerId: ID!) {
    player(playerId: $playerId) {
      mutation
      node {
        gamemode
      }
    }
  }
`

export const WORLD_SUBSCRIPTION = gql`
  subscription World($worldId: ID!) {
    world(worldId: $worldId) {
      mutation
      node {
        timeChanger
      }
    }
  }
`
