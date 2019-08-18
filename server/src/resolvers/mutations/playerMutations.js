import Helpers from '../../utils/helpers'

const createPlayer = async function(parent, args, { prisma }, info) {
  return prisma.mutation.createPlayer(args, info)
}

const joinWorld = async function(parent, args, ctx, info) {
  const { prisma, request } = ctx

  const {
    data: { gamemode },
    where
  } = args

  const id = Helpers.getUserId(request)

  const userExists = await prisma.exists.User({ id })
  if (!userExists) throw new Error('User not found')

  let existingPlayer

  const players = await prisma.query.players(
    {
      first: 1,
      where: {
        user: {
          id
        },
        world: where
      }
    },
    info
  )

  existingPlayer = players ? players[0] : null

  // Player creation
  if (!existingPlayer)
    existingPlayer = await createPlayer(
      null,
      {
        data: {
          isAdmin: true,
          gamemode,
          user: {
            connect: {
              id
            }
          },
          world: {
            connect: where
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
  return existingPlayer
}

const PlayerMutations = {
  joinWorld,
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
