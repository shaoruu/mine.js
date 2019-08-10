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

export const UPDATE_SETTINGS_MUTATION = gql`
  mutation UpdateSettings($id: ID!, $renderDistance: Int) {
    updateSettings(data: { id: $id, renderDistance: $renderDistance }) {
      id
      renderDistance
    }
  }
`

export const CREATE_WORLD_MUTATION = gql`
  mutation CreateWorld(
    $name: String!
    $seed: String!
    $gamemode: Gamemode!
    $type: WorldType!
  ) {
    createWorld(
      data: { name: $name, seed: $seed, gamemode: $gamemode, type: $type }
    ) {
      id
    }
  }
`

export const CREATE_PLAYER_MUTATION = gql`
  mutation CreatePlayer($gamemode: Gamemode!, $worldId: ID!) {
    createPlayer(data: { gamemode: $gamemode, worldId: $worldId })
  }
`

export const DELETE_WORLD_MUTATION = gql`
  mutation DeleteWorld($worldId: ID!) {
    deleteWorld(worldId: $worldId)
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
