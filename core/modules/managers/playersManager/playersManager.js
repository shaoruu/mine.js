import PlayerClient from './playerClient'

import { Vector2, Vector3 } from 'three'

function PlayersManager(scene) {
  const players = {}

  this.getPlayers = () => players
  this.getScene = () => scene
}

PlayersManager.prototype.register = function(node) {
  const {
    user: { username },
    x,
    y,
    z,
    dirx,
    diry
  } = node

  const newClient = new PlayerClient(username, new Vector3(x, y, z), new Vector2(dirx, diry))

  this.getPlayers()[username] = newClient

  newClient.addSelf(this.getScene())
}

PlayersManager.prototype.update = function(data) {
  const { mutation, node } = data

  switch (mutation) {
    case 'CREATED': {
      this.register(node)
      break
    }
    case 'UPDATED': {
      const {
        user: { username },
        x,
        y,
        z,
        dirx,
        diry
      } = node
      const player = this.getPlayers()[username]
      if (!player) this.register(node)
      else player.update(x, y, z, dirx, diry)
      break
    }
    default:
      break
  }
}

export default PlayersManager
