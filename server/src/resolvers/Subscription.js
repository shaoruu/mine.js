const Subscription = {
  block: {
    subscribe(parent, { worldId }, { prisma }, info) {
      return prisma.subscription.block(
        {
          where: {
            node: {
              world: {
                id: worldId
              }
            }
          }
        },
        info
      )
    }
  },
  message: {
    subscribe(parent, { worldId }, { prisma }, info) {
      return prisma.subscription.message({
        where: {
          node: {
            world: {
              id: worldId
            }
          }
        },
        info
      })
    }
  },
  player: {
    subscribe(parent, { username }, { prisma }, info) {
      return prisma.subscription.player(
        {
          where: {
            node: {
              user: {
                username: username
              }
            }
          }
        },
        info
      )
    }
  }
}

export default Subscription
