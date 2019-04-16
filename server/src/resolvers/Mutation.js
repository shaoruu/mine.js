import bcrypt from 'bcryptjs'

import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

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
				y: 40,
				z: 0,
				dirx: 0,
				diry: 0
			}
		})

		return prisma.mutation.updateWorld(
			{
				where: { id: world.id },
				data: {
					players: {
						connect: [{ id: owner.id }]
					}
				}
			},
			info
		)
	},
	async updatePlayer(parent, args, { prisma }, info) {
		const playerId = args.data.id
		delete args.data.id

		console.log(args.data.x, args.data.y, args.data.z)

		return prisma.mutation.updatePlayer(
			{
				where: {
					id: playerId
				},
				data: {
					...args.data
				}
			},
			info
		)
	}
}

export { Mutation as default }
