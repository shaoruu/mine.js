/* eslint-disable camelcase */
const defaultArray = []

const PlayerSubscriptions = {
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
            updatedFields_contains_some:
              updatedFields_contains_some || defaultArray,
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
  }
}

export default PlayerSubscriptions
