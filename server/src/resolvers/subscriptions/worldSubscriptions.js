const doesWorldExist = async (prisma, worldId) => {
  return !!prisma.world.findUnique({ where: { id: worldId } })
}

const WorldSubscriptions = {
  message: {
    async subscribe(parent, { worldId }, { prisma, pubsub }) {
      if (!(await doesWorldExist(prisma, worldId))) {
        throw new Error('World not found')
      }

      return pubsub.asyncIterator(`message ${worldId}`)
    }
  },
  world: {
    async subscribe(parent, { worldId }, { prisma, pubsub }) {
      if (!(await doesWorldExist(prisma, worldId))) {
        throw new Error('World not found')
      }

      return pubsub.asyncIterator(`world ${worldId}`)
    }
  }
}

export default WorldSubscriptions
