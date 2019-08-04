import redis from 'redis'
import debug from 'debug'

const log = output => debug('redis')(JSON.stringify(output, null, 2))

const redisClient = redis.createClient()

redisClient.on('error', err => {
  log(err)
})

redisClient.on('connect', () => {
  log('Redis client connected.')
})

export default redisClient
