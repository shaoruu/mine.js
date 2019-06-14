import gql from 'graphql-tag'
import * as Yup from 'yup'

/**
 * Mutations
 */
export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    createUser(
      data: { username: $username, email: $email, password: $password }
    ) {
      token
    }
  }
`

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(data: { email: $email, password: $password }) {
      token
    }
  }
`

export const CREATE_WORLD_MUTATION = gql`
  mutation CreateWorld($name: String!, $seed: String!, $gamemode: Gamemode!) {
    createWorld(data: { name: $name, seed: $seed, gamemode: $gamemode }) {
      id
    }
  }
`

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
  ) {
    updatePlayer(
      data: {
        id: $id
        x: $x
        y: $y
        z: $z
        dirx: $dirx
        diry: $diry
        cursor: $cursor
        data: $data
      }
    ) {
      x
      y
      z
    }
  }
`

export const UPDATE_BLOCK_MUTATION = gql`
  mutation UpdateBlock(
    $worldId: ID!
    $type: Int!
    $x: Int!
    $y: Int!
    $z: Int!
  ) {
    updateBlock(data: { worldId: $worldId, type: $type, x: $x, y: $y, z: $z }) {
      world {
        id
      }
      x
      y
      z
      type
    }
  }
`

export const DELETE_WORLD_MUTATION = gql`
  mutation DeleteWorld($worldId: ID!) {
    deleteWorld(worldId: $worldId)
  }
`

export const RUN_COMMAND_MUTATION = gql`
  mutation RunCommand($username: String!, $worldId: ID!, $command: String!) {
    runCommand(
      data: { username: $username, worldId: $worldId, command: $command }
    )
  }
`

/**
 * Validation Schemas
 */
export const REGISTER_SCHEMA = Yup.object().shape({
  username: Yup.string()
    .min(2, 'Username cannot be less than 2 characters.')
    .max(16, 'Username cannot be more than 16 characters.')
    .matches(/^[a-z0-9_]{2,16}$/i, 'Invalid Characters')
    .required('Username is required.'),
  email: Yup.string()
    .email('Please enter an email.')
    .required('Email is required.'),
  password: Yup.string()
    .min(8, 'Password must be more than 8 characters.')
    .required('Password is required.')
})

export const LOGIN_SCHEMA = Yup.object().shape({
  email: Yup.string()
    .email('Please enter an email.')
    .required('Email is required.'),
  password: Yup.string().required('Password is required.')
})

export const CREATE_WORLD_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Name is required.'),
  seed: Yup.string()
})
