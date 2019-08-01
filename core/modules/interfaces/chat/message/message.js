import Helpers from '../../../../utils/helpers'

import classes from './message.module.css'

export default function(type, sender, body) {
  const wrapper = document.createElement('div')
  const message = document.createElement('p')

  message.innerHTML = body

  switch (type) {
    case 'ERROR':
      Helpers.applyStyle(message, {
        color: 'red'
      })
      break
    case 'SERVER':
      break
    case 'PLAYER':
      message.innerHTML = `&lt;${sender}&gt;&nbsp;&nbsp;${body}`
      break
    case 'INFO':
      Helpers.applyStyle(message, {
        color: 'yellow'
      })
      break
    default:
      break
  }

  Helpers.applyStyle(wrapper, classes.wrapper)
  Helpers.applyStyle(message, classes.message)

  wrapper.appendChild(message)

  this.getType = () => type
  this.getSender = () => type
  this.getBody = () => body

  this.getGui = () => wrapper
}
