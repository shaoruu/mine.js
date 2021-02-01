import { prisma } from '../../lib/server'

const WorldQueries = {
  async myWorlds(parent, args, { user }) {
    return user
  },
  async world(parent, args) {
    const { query } = args
    const where = { id: Number(query) }

    await prisma.world.update({
      data: {
        lastPlayed: new Date()
      },
      where
    })

    return prisma.world.findUnique({
      where
    })
  }
}

export default WorldQueries
