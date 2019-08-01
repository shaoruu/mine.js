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
  },
  otherPlayers: {
    subscribe(parent, { worldId, playerId }, { prisma }, info) {
      return prisma.subscription.player(
        {
          where: {
            AND: {
              node: {
                world: {
                  id: worldId
                }
              }
            },
            NOT: {
              node: {
                id: playerId
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
