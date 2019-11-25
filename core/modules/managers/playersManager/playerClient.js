import ian13456 from '../../../assets/skin/ian13456.png'
import PlayerObject from '../../../lib/playerObject/playerObject'

function PlayerClient(username, pos, dir) {
  this.yAxisClamp = 0
  this.oldDiry = dir.y

  const playerMesh = new PlayerObject(ian13456, pos, dir)

  this.getUsername = () => username
  this.getPosition = () => playerMesh.position
  this.getDirection = () => dir
  this.getMesh = () => playerMesh
  this.getHead = () => playerMesh.skin.head
  this.getBody = () => playerMesh.skin.body
}

PlayerClient.prototype.addSelf = function(scene) {
  scene.add(this.getMesh())
}

PlayerClient.prototype.update = function(x, y, z, dirx, diry) {
  const meshRef = this.getMesh()

  meshRef.tweenPosition(x, y, z)
  meshRef.tweenDirection(dirx, diry)
}

export default PlayerClient
