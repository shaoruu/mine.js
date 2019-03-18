import { GraphQLServer, PubSub } from 'graphql-yoga'
import { resolvers } from './resolvers'
import prisma from './prisma'

const pubsub = new PubSub()

const server = new GraphQLServer({
	typeDefs: 'src/schema.graphql',
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
	console.log(`The server is up and running on port ${port}.`)
})
