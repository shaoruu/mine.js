import gql from 'graphql-tag'

export const UPDATE_PLAYER_MUTATION = gql`
  mutation UpdatePlayer(
    $id: ID!
    $x: Float
    $y: Float
    $z: Float
    $dirx: Float
    $diry: Float
    $cursor: Int
    $data: String
    $health: Int
    $armor: Int
    $hunger: Int
  ) {
    updatePlayer(
      where: { id: $id }
      data: {
        x: $x
        y: $y
        z: $z
        dirx: $dirx
        diry: $diry
        cursor: $cursor
        data: $data
        health: $health
        armor: $armor
        hunger: $hunger
      }
    ) {
      x
      y
      z
    }
  }
`

export const UPDATE_WORLD_MUTATION = gql`
  mutation UpdateWorld($id: ID!, $name: String, $time: Float, $days: Int) {
    updateWorld(
      where: { id: $id }
      data: { name: $name, time: $time, days: $days }
    ) {
      name
      time
      days
    }
  }
`

export const RUN_COMMAND_MUTATION = gql`
  mutation RunCommand($playerId: ID!, $worldId: ID!, $command: String!) {
    runCommand(
      data: { playerId: $playerId, worldId: $worldId, command: $command }
    )
  }
`
