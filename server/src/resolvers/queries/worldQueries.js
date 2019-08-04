import Helpers from '../../utils/helpers'

const WorldQueries = {
  myWorlds(parent, args, { prisma, request }, info) {
    const userId = Helpers.getUserId(request)
    return prisma.query.user({ where: { id: userId } }, info)
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
  }
}

export default WorldQueries
