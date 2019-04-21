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

/**
 * Validation Schemas
 */
export const REGISTER_SCHEMA = Yup.object().shape({
	email: Yup.string().required('Email is required.'),
	username: Yup.string().required('Username is required.'),
	password: Yup.string().required('Password is required.')
})

export const LOGIN_SCHEMA = Yup.object().shape({
	email: Yup.string().required('Email is required.'),
	password: Yup.string().required('Password is required.')
})

export const CREATE_WORLD_SCHEMA = Yup.object().shape({
	name: Yup.string().required('Name is required.'),
	seed: Yup.string().required('Seed is required.')
})
