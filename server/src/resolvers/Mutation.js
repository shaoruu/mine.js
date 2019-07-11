import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'
import getBlockRepresentation from '../utils/getBlockRepresentation'

import bcrypt from 'bcryptjs'

const DEFAULT_MESSAGE = 'Unknown command. Try /help for a list of commands.'

const Mutation = {
  async createUser(parent, args, { prisma }) {
    const password = await hashPassword(args.data.password)
    const user = await prisma.mutation.createUser({
      data: {
        ...args.data,
        password
      }
    })

    return {
      user,
      token: generateToken(user.id)
    }
  },
  async login(parent, args, { prisma }) {
    const user = await prisma.query.user({
      where: {
        email: args.data.email
      }
    })

    if (!user) {
      throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(args.data.password, user.password)

    if (!isMatch) {
      throw new Error('Unable to login')
    }

    return {
      user,
      token: generateToken(user.id)
    }
  },
  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request)

    return prisma.mutation.deleteUser(
      {
        where: {
          id: userId
        }
      },
      info
    )
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request)

    if (typeof args.data.password === 'string') {
      args.data.password = await hashPassword(args.data.password)
    }

    return prisma.mutation.updateUser(
      {
        where: {
          id: userId
        },
        data: args.data
      },
      info
    )
  },
  async createWorld(parent, args, { prisma, request }, info) {
    const id = getUserId(request)
    const {
      data: { gamemode, name, seed }
    } = args

    // Check if user exists
    const userExists = await prisma.exists.User({
      id
    })
    if (!userExists) throw new Error('User not found')

    // World creation
    const world = await prisma.mutation.createWorld(
      {
        data: {
          lastPlayed: new Date().toISOString(),
          name,
          seed
        }
      },
      '{ id }'
    )

    // Adding owner into world
    const owner = await prisma.mutation.createPlayer({
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
            id: world.id
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
        }
      }
    })

    return prisma.mutation.updateWorld(
      {
        where: { id: world.id },
        data: {
          players: {
            connect: [{ id: owner.id }]
          }
        }
      },
      info
    )
  },
  async updatePlayer(parent, args, { prisma }, info) {
    const playerId = args.data.id
    delete args.data.id

    const { cursor } = args.data
    delete args.data.cursor

    const { data } = args.data
    delete args.data.data

    const inventoryUpdate = { inventory: { update: { cursor, data } } }
    if (!cursor) delete inventoryUpdate.cursor
    if (!data) delete inventoryUpdate.data

    return prisma.mutation.updatePlayer(
      {
        where: {
          id: playerId
        },
        data: {
          ...args.data,
          ...inventoryUpdate
        }
      },
      info
    )
  },
  updateBlock(parent, args, { prisma }, info) {
    const { x, y, z, type, worldId } = args.data

    const repr = getBlockRepresentation(worldId, x, y, z)

    return prisma.mutation.upsertBlock(
      {
        where: {
          representation: repr
        },
        create: {
          representation: repr,
          type,
          x,
          y,
          z,
          world: {
            connect: {
              id: worldId
            }
          }
        },
        update: {
          type
        }
      },
      info
    )
  },
  async deleteWorld(parent, args, { prisma }) {
    await prisma.mutation.deleteWorld({ where: { id: args.worldId } })
    return true
  },
  async runCommand(
    parent,
    {
      data: { playerId, worldId, command }
    },
    { prisma },
    info
  ) {
    let type = 'ERROR'
    let sender = ''
    let body = DEFAULT_MESSAGE

    const {
      user: { username }
    } = await prisma.query.player(
      {
        where: {
          id: playerId
        }
      },
      `{
        user {
          username
        }
      }`
    )

    if (command.startsWith('/')) {
      const args = command
        .substr(1)
        .split(' ')
        .filter(ele => !!ele)

      switch (args[0]) {
        case 'gamemode': {
          let isError = false

          switch (args[1]) {
            case 's':
            case 'survival':
            case '0': {
              if (args[2]) {
                // do something else
              } else {
                await prisma.mutation.updatePlayer({
                  data: {
                    gamemode: 'SURVIVAL'
                  },
                  where: { id: playerId }
                })
              }

              break
            }

            case 'c':
            case 'creative':
            case '1': {
              if (args[2]) {
                // do something else
              } else {
                await prisma.mutation.updatePlayer({
                  data: {
                    gamemode: 'CREATIVE'
                  },
                  where: { id: playerId }
                })
              }

              break
            }

            case 'sp':
            case 'spectator':
            case '3': {
              if (args[2]) {
                // do something else
              } else {
                await prisma.mutation.updatePlayer({
                  data: {
                    gamemode: 'SPECTATOR'
                  },
                  where: { id: playerId }
                })
              }

              break
            }

            default:
              isError = true
              break
          }

          if (!isError) {
            type = 'SERVER'
            body = `${username}'s gamemode has been updated.`
          }

          break
        }
        default:
          break
      }
    } else {
      // NORMAL MESSAGE
      type = 'PLAYER'
      sender = username
      body = command
    }

    await prisma.mutation.createMessage({
      data: {
        type,
        sender,
        body,
        world: {
          connect: {
            id: worldId
          }
        }
      }
    })

    return true
  }
}

export { Mutation as default }
