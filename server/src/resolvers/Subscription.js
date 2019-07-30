/* eslint-disable camelcase */
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
    subscribe(parent, { worldId, mutation_in }, { prisma }, info) {
      return prisma.subscription.message(
        {
          where: {
            mutation_in: mutation_in || defaultArray,
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
      { username, worldId, mutation_in, updatedFields_contains_some },
      { prisma },
      info
    ) {
      return prisma.subscription.player(
        {
          where: {
            updatedFields_contains_some: updatedFields_contains_some || defaultArray,
            mutation_in: mutation_in || defaultArray,
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
  },
  world: {
    subscribe(parent, { worldId, mutation_in, updatedFields_contains_some }, { prisma }, info) {
      return prisma.subscription.world(
        {
          where: {
            updatedFields_contains_some: updatedFields_contains_some || defaultArray,
            mutation_in: mutation_in || defaultArray,
            node: {
              id: worldId
            }
          }
        },
        info
      )
    }
  }
}

export default Subscription
