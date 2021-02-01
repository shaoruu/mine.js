/**
 * EACH KEY OF FIRST LAYER ARE THE FIRST ARGUMENTS
 * THEY ARE ALL ARRAYS OF variationS.
 */

export default {
  gamemode: [
    {
      variation: ['s', 'survival', '0'],
      more: null,
      run: async ({ prisma, playerId }) =>
        prisma.player.update({
          data: {
            gamemode: 'SURVIVAL'
          },
          where: { id: playerId }
        })
    },
    {
      variation: ['c', 'creative', '1'],
      more: null,
      run: async ({ prisma, playerId }) =>
        prisma.player.update({
          data: {
            gamemode: 'CREATIVE'
          },
          where: { id: playerId }
        })
    },
    {
      variation: ['sp', 'spectator', '3'],
      more: null,
      run: async ({ prisma, playerId }) =>
        prisma.player.update({
          data: {
            gamemode: 'SPECTATOR'
          },
          where: { id: playerId }
        })
    },
    ({ username }) => `${username}'s gamemode has been updated.`
  ],
  time: [
    {
      variation: 'set',
      more: [
        {
          variation: ['day'],
          more: null,
          run: ({ prisma, worldId }) =>
            prisma.world.update({
              data: {
                timeChanger: 600.0
              },
              where: { id: worldId }
            })
        },
        {
          variation: ['night'],
          more: null,
          run: async ({ worldId, prisma }) =>
            prisma.world.update({
              data: {
                timeChanger: 1800.0
              },
              where: { id: worldId }
            })
        },
        {
          variation: arg => {
            const parsedTime = Number(arg)
            if (!isNaN(parsedTime)) return parsedTime >= 0 && parsedTime <= 2400
            return false
          },
          more: null,
          run: async ({ worldId, arg, prisma }) =>
            prisma.world.update({
              data: {
                timeChanger: Number(arg)
              },
              where: {
                id: worldId
              }
            })
        },
        ({ arg }) => `Set the time to ${arg}`
      ]
    },
    ({ arg }) => `${arg}`
  ]
}
