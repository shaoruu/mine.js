import { resolvers } from './resolvers'
import prisma from './prisma'

import { GraphQLServer, PubSub } from 'graphql-yoga'

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: 'server/src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      request
    }
  }
})

server.start({ port: process.env.PORT | 4000 }, ({ port }) => {
  // eslint-disable-next-line no-console
  console.log(`The server is up and running on port ${port}.`)
})
