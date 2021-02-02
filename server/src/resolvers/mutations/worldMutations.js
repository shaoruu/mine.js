import commands from '../../lib/game/commands'
import { prisma } from '../../lib/server'

const DEFAULT_MESSAGE = 'Unknown command. Try /help for a list of commands.'

const WorldMutations = {
  async createWorld(parent, args, { user }) {
    const {
      data: { gamemode, name, seed, type }
    } = args

    // Check if user exists
    if (!user) throw new Error('User not found')

    // World creation
    const world = await prisma.world.create({
      data: {
        lastPlayed: new Date(),
        name,
        seed,
        type,
        time: 1200,
        days: 0
      }
    })

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        worlds: {
          connect: {
            id: world.id
          }
        }
      }
    })

    await prisma.player.create({
      data: {
        isAdmin: true,
        gamemode,
        userId: user.id,
        worldId: world.id,
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

    return world
  },
  updateWorld(parent, args) {
    let { where } = args
    const {
      data: { id, ...data }
    } = args

    if (!where && id) {
      where = {
        id: Number(id)
      }
    }

    return prisma.world.update({
      where,
      data
    })
  },
  async deleteWorld(parent, { worldId }) {
    const players = await prisma.player.findMany({
      where: {
        worldId: Number(worldId)
      },
      select: {
        id: true,
        inventory: true
      }
    })

    await Promise.all(
      players.map(async player => {
        await prisma.inventory.delete({
          where: {
            id: player.inventory.id
          }
        })

        return prisma.player.delete({
          where: {
            id: Number(player.id)
          }
        })
      })
    )

    const messages = await prisma.message.findMany({
      where: {
        worldId: Number(worldId)
      },
      select: {
        id: true
      }
    })

    await Promise.all(
      messages.map(message =>
        prisma.message.delete({
          where: {
            id: Number(message.id)
          }
        })
      )
    )

    return prisma.world.delete({
      where: {
        id: Number(worldId)
      }
    })
  },
  async runCommand(
    parent,
    { data: { playerId, worldId, command } },
    { pubsub }
  ) {
    let type = 'ERROR'
    let sender = ''
    let body = DEFAULT_MESSAGE

    const {
      user: { username }
    } = await prisma.player.findUnique({
      where: {
        id: Number(playerId)
      },
      select: {
        user: true
      }
    })

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
            prisma,
            pubsub
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

    const message = await prisma.message.create({
      data: {
        type,
        sender,
        body,
        worldId: Number(worldId)
      }
    })

    pubsub.publish(`message ${worldId}`, {
      message: {
        mutation: 'CREATED',
        node: message
      }
    })

    return true
  }
}

export default WorldMutations
