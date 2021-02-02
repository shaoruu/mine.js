const UserQueries = {
  async me(parent, args, { user }) {
    if (!user) throw new Error('Unknown token')

    return user
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

    return prisma.user.findMany(opArgs, info)
  }
}

export default UserQueries
