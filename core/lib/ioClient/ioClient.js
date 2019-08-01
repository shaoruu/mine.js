import Config from '../../config/config'

import socketIOClient from 'socket.io-client'

const SOCKET_ENDPOINT = Config.tech.socketEndpoint

function IOClient() {
  const socket = socketIOClient(SOCKET_ENDPOINT)

  this.getSocket = () => socket
}

IOClient.prototype.on = function(event, func) {
  this.getSocket().on(event, func)
}

IOClient.prototype.emit = function(event, pkg) {
  this.getSocket().emit(event, pkg)
}

IOClient.prototype.disconnect = function() {
  this.getSocket().disconnect()
}

export default IOClient
