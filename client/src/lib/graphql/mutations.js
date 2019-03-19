import gql from 'graphql-tag'
import * as Yup from 'yup'

/**
 * Mutations
 */
export const REGISTER_MUTATION = gql`
	mutation Register($username: String!, $email: String!, $password: String!) {
		createUser(data: { username: $username, email: $email, password: $password }) {
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
			# name
			# seed
			# players {
			# 	user {
			# 		username
			# 	}
			# 	position {
			# 		x
			# 		y
			# 		z
			# 	}
			# 	gamemode
			# }
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
