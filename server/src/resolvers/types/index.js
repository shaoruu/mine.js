const fieldResolver = (root, child) => {
  return (parent, _, { prisma }) => {
    return prisma[root].findUnique({ where: { id: parent.id } })[child]()
  }
}

const generateFieldResolvers = (root, children) => {
  const resolvers = {}

  children.forEach(child => {
    resolvers[child] = fieldResolver(root, child)
  })

  return resolvers
}

export default {
  AuthPayload: {
    user: (parent, args, { prisma }, info) => {
      const { user } = parent || {}

      return user
        ? prisma.query.user(
            {
              where: {
                id: user.id
              }
            },
            info
          )
        : null
    }
  },
  User: generateFieldResolvers('user', ['settings', 'worlds']),
  Player: generateFieldResolvers('player', ['user', 'world', 'inventory']),
  World: generateFieldResolvers('world', [
    'changedBlocks',
    'players',
    'messages'
  ]),
  Message: generateFieldResolvers('message', ['world']),
  Block: generateFieldResolvers('block', ['world']),
  Settings: generateFieldResolvers('settings', ['user']),
  Inventory: generateFieldResolvers('inventory', ['player'])
}
