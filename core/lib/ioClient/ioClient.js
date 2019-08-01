import Config from '../../config/config'

import socketIOClient from 'socket.io-client'

const SOCKET_ENDPOINT = Config.tech.socketEndpoint

function IOClient() {
  const socket = socketIOClient(SOCKET_ENDPOINT)

  this.getSocket = () => socket
}

IOClient.prototype.emit = function(event, pkg) {
  this.getSocket().emit(event, pkg)
}

export default IOClient
