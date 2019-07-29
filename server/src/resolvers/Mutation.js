import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'
import getBlockRepresentation from '../utils/getBlockRepresentation'
import commands from '../lib/gameCommands'

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
          seed,
          time: 1200,
          days: 0
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
  async updateWorld(parent, args, { prisma }, info) {
    const worldId = args.data.id
    delete args.data.id

    return prisma.mutation.updateWorld(
      {
        where: {
          id: worldId
        },
        data: {
          ...args.data
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
    { prisma }
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

      const layer1 = commands[args[0]]

      if (layer1) {
        let isError = true

        const recursiveProcess = async (cmdInfoArr, index) => {
          const instance = cmdInfoArr.find(({ variation }, i) => {
            if (cmdInfoArr.length - 1 === i) return false
            if (typeof variation === 'function') return variation(args[index])
            return variation.includes(args[index])
          })

          if (!instance) {
            isError = true
            return
          }

          const { more, run } = instance

          if (more) await recursiveProcess(more, index + 1)
          if (!run) return

          isError = false

          const context = {
            worldId,
            playerId,
            username,
            arg: args[index],
            prisma
          }

          await run(context)

          type = 'SERVER'
          const defaultFallback = cmdInfoArr[cmdInfoArr.length - 1]
          if (defaultFallback) body = defaultFallback({ username, arg: args[index] })
          else body = `Success on running command: /${args[0]}`
        }

        await recursiveProcess(layer1, 1)

        if (isError) {
          type = 'ERROR'
          body = `Incorrect arguments for command: /${args[0]}`
        }
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
