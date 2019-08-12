import { resolvers } from './resolvers'
import { prisma, socketIO } from './lib/server'

import debug from 'debug'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import fs from 'fs'
import { fileLoader, mergeTypes } from 'merge-graphql-schemas'

const log = output => debug('server')(JSON.stringify(output, null, 2))

const pubsub = new PubSub()

let baseSchema

const schemaFile = `${__dirname}/generated/prisma.graphql`

if (fs.existsSync(schemaFile)) {
  baseSchema = fs.readFileSync(schemaFile, 'utf-8')
}

const schema = fileLoader(`${__dirname}/schema/api/`, {
  recursive: true
})

const apiSchema = mergeTypes([baseSchema].concat(schema), { all: true })

const server = new GraphQLServer({
  // typeDefs: 'server/src/schema.graphql',
  typeDefs: apiSchema,
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
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
