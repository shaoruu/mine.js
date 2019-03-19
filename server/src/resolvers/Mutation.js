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

		const userExists = await prisma.exists.User({
			id
		})

		if (!userExists) throw new Error('User not found')

		// World generation
		const world = await prisma.mutation.createWorld(
			{
				data: {
					name,
					seed
				}
			},
			'{ id }'
		)

		const owner = await prisma.mutation.createPlayer({
			data: {
				isAdmin: true,
				gamemode: args.data.gamemode,
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
				position: {
					create: {
						x: 0,
						y: 0,
						z: 0
					}
				}
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
	}
}

export { Mutation as default }
