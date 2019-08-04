import Helpers from '../../utils/helpers'

const UserQueries = {
  async me(parent, args, { prisma, request }, info) {
    const id = Helpers.getUserId(request)

    const me = await prisma.query.user({ where: { id } }, info)

    if (!me) throw new Error('Unknown token')

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

export default UserQueries
