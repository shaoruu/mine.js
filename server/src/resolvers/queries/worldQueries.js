const WorldQueries = {
  myWorlds(parent, args, { user }) {
    return user.worlds
  },
  async world(parent, args, { prisma }) {
    const { query } = args
    let { where } = args

    if (!where && query) {
      where = {
        id: query
      }
    }

    await prisma.world.update({
      data: {
        lastPlayed: new Date().toISOString()
      },
      where
    })

    return prisma.world.findUnique({ where })
  }
}

export default WorldQueries
