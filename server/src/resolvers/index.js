import Query from './queries'
import Mutation from './mutations'
import Subscription from './subscriptions'
import Types from './types'

export const resolvers = {
  Query,
  Mutation,
  Subscription,
  ...Types,
}
