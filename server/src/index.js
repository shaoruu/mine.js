import { resolvers } from './resolvers'
import { prisma, socketIO } from './lib/server'
import Helpers from './utils/helpers'

import debug from 'debug'
import { GraphQLServer, PubSub } from 'graphql-yoga'

const log = output => debug('server')(JSON.stringify(output, null, 2))

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: 'server/src/schema.graphql',
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  async context(request) {
    const userId = Helpers.getUserId(request)

    return {
      pubsub,
      prisma,
      socketIO,
      request,
      user: userId
        ? await prisma.user.findUnique({
            where: {
              id: userId
            }
          })
        : null
    }
  }
})

server.start({ port: process.env.PORT | 4000 }, ({ port }) => {
  // eslint-disable-next-line no-console
  log(`The server is up and running on http://localhost:${port}`)
})
