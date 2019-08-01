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
  subscription Player(
    $username: String!
    $mutation_in: [String!]
    $worldId: ID!
    $updatedFields_contains_some: [String!]
  ) {
    player(
      username: $username
      worldId: $worldId
      mutation_in: $mutation_in
      updatedFields_contains_some: $updatedFields_contains_some
    ) {
      mutation
      node {
        gamemode
      }
    }
  }
`

export const WORLD_SUBSCRIPTION = gql`
  subscription World(
    $worldId: ID!
    $mutation_in: [String!]
    $updatedFields_contains_some: [String!]
  ) {
    world(
      worldId: $worldId
      mutation_in: $mutation_in
      updatedFields_contains_some: $updatedFields_contains_some
    ) {
      mutation
      node {
        timeChanger
      }
    }
  }
`
