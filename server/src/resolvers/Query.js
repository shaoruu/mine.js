import Helpers from '../utils/helpers'

const Query = {
  async me(parent, args, { prisma, request }, info) {
    const id = Helpers.getUserId(request)

    const me = await prisma.query.user({ where: { id } }, info)

    if (!me) throw new Error('Unknown token')

    return me
  },
  myWorlds(parent, args, { prisma, request }, info) {
    const userId = Helpers.getUserId(request)
    const opArgs = {
      first: args.first,
      skip: args.skip,
      after: args.after,
      orderBy: args.orderBy,
      where: {
        players_some: {
          user: {
            id: userId
          }
        }
      }
    }

    return prisma.query.worlds(opArgs, info)
  },
  async world(parent, args, { prisma }, info) {
    const id = args.query

    await prisma.mutation.updateWorld({
      data: {
        lastPlayed: new Date().toISOString()
      },
      where: {
        id
      }
    })
    return prisma.query.world({ where: { id } }, info)
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
