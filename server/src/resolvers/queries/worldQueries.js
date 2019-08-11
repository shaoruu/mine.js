import Helpers from '../../utils/helpers'

const WorldQueries = {
  myWorlds(parent, args, { prisma, request }, info) {
    const userId = Helpers.getUserId(request)
    return prisma.query.user({ where: { id: userId } }, info)
  },
  async world(parent, args, { prisma }, info) {
    // const id = args.query

    const { query } = args
    let { where } = args

    if (!where && query) {
      where = {
        id: query
      }
    }

    await prisma.mutation.updateWorld({
      data: {
        lastPlayed: new Date().toISOString()
      },
      where
    })
    return prisma.query.world({ where }, info)
  }
}

export default WorldQueries
