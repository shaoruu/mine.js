import { prisma } from '../../lib/server'

const createPlayer = async function(parent, args) {
  return prisma.player.create(args)
}

const joinWorld = async function(parent, args, ctx, info) {
  const { user } = ctx

  const {
    data: { gamemode, worldId }
  } = args

  if (!user) throw new Error('User not found')

  let player = await prisma.player.findFirst(
    {
      where: {
        user,
        world: {
          where: {
            id: worldId
          }
        }
      }
    },
    info
  )

  // Player creation
  if (!player)
    player = await createPlayer(
      null,
      {
        data: {
          isAdmin: true,
          gamemode,
          user: {
            connect: {
              id: user.id
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
      },
      ctx,
      info
    )

  return player
}

const PlayerMutations = {
  joinWorld,
  async updatePlayer(parent, args) {
    let { where } = args

    const { id, cursor, data, ...otherData } = args.data || {}

    if (!where && id) {
      where = {
        id: Number(id)
      }
    }

    const inventoryUpdate = { inventory: { update: { cursor, data } } }
    if (!cursor) delete inventoryUpdate.cursor
    if (!data) delete inventoryUpdate.data

    return prisma.player.update({
      where,
      data: {
        ...otherData,
        ...inventoryUpdate
      }
    })
  }
}

export default PlayerMutations
