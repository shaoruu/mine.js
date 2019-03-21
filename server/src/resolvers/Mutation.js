import bcrypt from 'bcryptjs'

import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'
import generateSingleChunk from '../utils/generateSingleChunk'
import getChunkRepresentation from '../utils/getChunkRepresentation'

const size = 16,
	dimension = 20,
	height = 20,
	renderDistance = 3

const Mutation = {
	async createUser(parent, args, { prisma }, info) {
		const password = await hashPassword(args.data.password)
		const user = await prisma.mutation.createUser({
			data: {
				...args.data,
				password
			}
		})

		return {
			user,
			token: generateToken(user.id)
		}
	},
	async login(parent, args, { prisma }, info) {
		const user = await prisma.query.user({
			where: {
				email: args.data.email
			}
		})

		if (!user) {
			throw new Error('Unable to login')
		}

		const isMatch = await bcrypt.compare(args.data.password, user.password)

		if (!isMatch) {
			throw new Error('Unable to login')
		}

		return {
			user,
			token: generateToken(user.id)
		}
	},
	async deleteUser(parent, args, { prisma, request }, info) {
		const userId = getUserId(request)

		return prisma.mutation.deleteUser(
			{
				where: {
					id: userId
				}
			},
			info
		)
	},
	async updateUser(parent, args, { prisma, request }, info) {
		const userId = getUserId(request)

		if (typeof args.data.password === 'string') {
			args.data.password = await hashPassword(args.data.password)
		}

		return prisma.mutation.updateUser(
			{
				where: {
					id: userId
				},
				data: args.data
			},
			info
		)
	},
	async createWorld(parent, args, { prisma, request }, info) {
		const id = getUserId(request)
		const {
			data: { gamemode, name, seed }
		} = args

		// Check if user exists
		const userExists = await prisma.exists.User({
			id
		})
		if (!userExists) throw new Error('User not found')

		// World creation
		const world = await prisma.mutation.createWorld(
			{
				data: {
					name,
					seed
				}
			},
			'{ id }'
		)

		const initialChunk = generateSingleChunk(0, 0, size, height)

		// Adding owner into world
		const owner = await prisma.mutation.createPlayer({
			data: {
				isAdmin: true,
				gamemode: gamemode,
				user: {
					connect: {
						id
					}
				},
				world: {
					connect: {
						id: world.id
					}
				},
				x: 0,
				y: 0,
				z: 0,
				dirx: 0,
				diry: 0,
				loadedChunks: getChunkRepresentation(initialChunk.x, initialChunk.z)
			}
		})

		/**
		 * TODO: Implement chunk generation and blocks here.
		 */
		// Chunk generation around player
		return prisma.mutation.updateWorld(
			{
				where: { id: world.id },
				data: {
					players: {
						connect: [{ id: owner.id }]
					},
					chunks: {
						create: [
							{
								...initialChunk,
								world: {
									connect: {
										id: world.id
									}
								}
							}
						]
					}
				}
			},
			info
		)
	},
	updatePlayer(parent, args, { prisma }, info) {
		const id = args.data.id
		delete args.data.id

		// console.log({ ...args.data })
		const { x, z } = args.data
		console.log(Math.floor(x / size), Math.floor(z / size))
		const chunkx = Math.floor(x / size),
			chunkz = Math.floor(z / size)

		let chunks = ''
		for (let i = chunkx - renderDistance; i <= chunkx + renderDistance; i++)
			for (let j = chunkz - renderDistance; j <= chunkz + renderDistance; j++)
				chunks += getChunkRepresentation(i, j)

		return prisma.mutation.updatePlayer(
			{
				where: {
					id
				},
				data: {
					...args.data,
					loadedChunks: chunks
				}
			},
			info
		)
	}
}

export { Mutation as default }
