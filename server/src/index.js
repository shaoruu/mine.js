import { resolvers } from './resolvers'
import { socketIO, prisma } from './lib/server'

import debug from 'debug'
import { GraphQLServer, PubSub } from 'graphql-yoga'

const log = output => debug('server')(output)

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: 'server/src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      socketIO,
      request
    }
  }
})

server.start({ port: process.env.PORT | 4000 }, ({ port }) => {
  // eslint-disable-next-line no-console
  log(`The server is up and running on port ${port}.`)
})
