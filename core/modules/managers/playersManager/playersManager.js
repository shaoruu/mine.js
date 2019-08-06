import PlayerClient from './playerClient'

import { Vector2, Vector3 } from 'three'

function PlayersManager(scene) {
  const players = {}

  this.getPlayers = () => players
  this.getScene = () => scene
  this.getPlayerCount = () => Object.keys(players).length
}

PlayersManager.prototype.register = function(node) {
  const { username, x, y, z, dirx, diry } = node

  const newClient = new PlayerClient(
    username,
    new Vector3(x, y, z),
    new Vector2(dirx, diry)
  )

  this.getPlayers()[username] = newClient

  newClient.addSelf(this.getScene())
}

PlayersManager.prototype.update = function(data) {
  const { username, x, y, z, dirx, diry } = data
  const player = this.getPlayers()[username]
  if (!player) this.register(data)
  else player.update(x, y, z, dirx, diry)
}

export default PlayersManager
