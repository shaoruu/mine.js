import Helpers from '../../utils/helpers'
import commands from '../../lib/game/commands'

const DEFAULT_MESSAGE = 'Unknown command. Try /help for a list of commands.'

const WorldMutations = {
  async createWorld(parent, args, { prisma, request }, info) {
    const id = Helpers.getUserId(request)
    const {
      data: { gamemode, name, seed, type }
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
          type,
          time: 1200,
          days: 0
        }
      },
      '{ id }'
    )

    await prisma.mutation.updateUser({
      where: {
        id
      },
      data: {
        worlds: {
          connect: {
            id: world.id
          }
        }
      }
    })

    // Adding owner into world
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
        },
        health: 20,
        armor: 0,
        hunger: 20
      }
    })

    return prisma.query.world(
      {
        where: {
          id: world.id
        }
      },
      info
    )
  },
  async updateWorld(parent, args, { prisma }, info) {
    let { where } = args
    const {
      data: { id, ...data }
    } = args

    if (!where && id) {
      where = {
        id
      }
    }

    return prisma.mutation.updateWorld(
      {
        where,
        data
      },
      info
    )
  },
  deleteWorld(parent, args, { prisma }) {
    return prisma.mutation.deleteWorld(args)
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
          if (defaultFallback)
            body = defaultFallback({ username, arg: args[index] })
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

export default WorldMutations
