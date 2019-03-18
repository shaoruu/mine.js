const Query = {
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
