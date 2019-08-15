import Helpers from '../../../utils/helpers'

import classes from './connectionStatus.module.css'

import { SubscriptionClient } from 'subscriptions-transport-ws'

function ConnectionStatus(container) {
  const { hostname } = window.location
  const subscriptionClient = new SubscriptionClient(`ws://${hostname}:4000`, {
    reconnect: true
  })

  subscriptionClient.onConnected(this.onConnected.bind(this))
  subscriptionClient.onReconnected(this.onReconnected.bind(this))
  subscriptionClient.onDisconnected(this.onDisconnected.bind(this))

  const wrapper = document.createElement('div')
  const warningTitle = document.createElement('p')
  const warningBody = document.createElement('p')

  warningTitle.innerHTML = 'Connection Lost'
  warningBody.innerHTML = "Can't connect to server"

  wrapper.appendChild(warningTitle)
  wrapper.appendChild(warningBody)

  Helpers.applyStyle(wrapper, classes.wrapper)
  Helpers.applyStyle(warningTitle, classes.title)
  Helpers.applyStyle(warningBody, classes.body)

  container.appendChild(wrapper)

  this.getDOM_wrapper = () => wrapper
}

ConnectionStatus.prototype.onConnected = function() {
  Helpers.fancyLog(
    '%cServer Connected!',
    'background-color: green; color: white; padding: 4px; font-size: 20px; border-radius: 5px'
  )
}

ConnectionStatus.prototype.onReconnected = function() {
  this.getDOM_wrapper().style.display = 'none'
}

ConnectionStatus.prototype.onDisconnected = function() {
  this.getDOM_wrapper().style.display = 'flex'
}

export default ConnectionStatus
