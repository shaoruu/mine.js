import { Prisma } from 'prisma-binding'

const prisma = new Prisma({
  typeDefs: 'server/src/generated/prisma.graphql',
  endpoint: process.env.PRISMA_ENDPOINT || 'http://localhost:4466',
  secret: 'thisismysupersecrettext'
})

export default prisma
