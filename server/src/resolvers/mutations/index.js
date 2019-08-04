import PlayerMutations from './playerMutations'
import UserMutations from './userMutations'
import WorldMutations from './worldMutations'

export default {
  ...PlayerMutations,
  ...UserMutations,
  ...WorldMutations
}
