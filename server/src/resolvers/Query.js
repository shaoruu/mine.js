import getUserId from '../utils/getUserId'

const Query = {
	async me(parent, args, { prisma, request }, info) {
		const id = getUserId(request)

		const me = await prisma.query.user({ where: { id } }, info)
		if (!me) throw new Error('Unknown token')
		console.log(me)

		return me
	},
	users(parent, args, { prisma }, info) {
		const opArgs = {
			first: args.first,
			skip: args.skip,
			after: args.after
		}

		if (args.query) {
			opArgs.where = {
				OR: [
					{
						name_contains: args.query
					}
				]
			}
		}

		return prisma.query.users(opArgs, info)
	}
}

export default Query
