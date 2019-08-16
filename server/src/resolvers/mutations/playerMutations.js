import Helpers from '../../utils/helpers'

const PlayerMutations = {
  async createPlayer(
    parent,
    {
      data: { worldId, gamemode }
    },
    { prisma, request }
  ) {
    const id = Helpers.getUserId(request)

    const userExists = await prisma.exists.User({ id })
    if (!userExists) throw new Error('User not found')

    const existingPlayer = await prisma.exists.Player({
      user: {
        id
      },
      world: {
        id: worldId
      }
    })

    console.log(existingPlayer)

    // Player creation
    if (!existingPlayer)
      await prisma.mutation.createPlayer({
        data: {
          isAdmin: true,
          gamemode,
          user: {
            connect: {
              id
            }
          },
          world: {
            connect: {
              id: worldId
            }
          },
          x: 0,
          y: Number.MIN_SAFE_INTEGER,
          z: 0,
          dirx: 0,
          diry: 0,
          inventory: {
            create: {
              cursor: 0,
              data:
                'ARMOR:0;0;0;0;|BACKPACK:0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;|HOTBAR:0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;0,0;'
            }
          },
          health: 20,
          armor: 0,
          hunger: 20
        }
      })

    return true
  },
  async updatePlayer(parent, args, { prisma }, info) {
    let { where } = args

    const { id, cursor, data, ...otherData } = args.data || {}

    if (!where && id) {
      where = {
        id
      }
    }

    const inventoryUpdate = { inventory: { update: { cursor, data } } }
    if (!cursor) delete inventoryUpdate.cursor
    if (!data) delete inventoryUpdate.data

    return prisma.mutation.updatePlayer(
      {
        where,
        data: {
          ...otherData,
          ...inventoryUpdate
        }
      },
      info
    )
  }
}

export default PlayerMutations
