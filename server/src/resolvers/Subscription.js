const defaultArray = []

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
      return prisma.subscription.message(
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
  player: {
    subscribe(
      parent,
      { username, worldId, updatedFields_contains_some },
      { prisma },
      info
    ) {
      return prisma.subscription.player(
        {
          where: {
            updatedFields_contains_some:
              updatedFields_contains_some || defaultArray,
            node: {
              user: {
                username
              },
              world: {
                id: worldId
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
