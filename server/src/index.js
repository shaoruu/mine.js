import { resolvers } from './resolvers'
import prisma from './prisma'

import { createServer } from 'http'
import socketIO from 'socket.io'
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

const app = createServer()
const io = socketIO(app)

app.listen(5000, () => {
  console.log('Socket.io running on port 5000')
})

io.on('connection', function(socket) {
  console.log('user connected')

  socket.on('disconnect', function() {
    console.log('user disconnected')
  })
})

server.start({ port: process.env.PORT | 4000 }, ({ port }) => {
  // eslint-disable-next-line no-console
  console.log(`The server is up and running on port ${port}.`)
})
