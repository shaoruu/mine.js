import Helpers from '../../../Utils/Helpers'
import classes from './Message.module.css'

export default function(type, sender, body) {
  const wrapper = document.createElement('div')
  const message = document.createElement('p')

  switch (type) {
    case 'SERVER':
      message.innerHTML = body
      break
    case 'PLAYER':
      message.innerHTML = `&lt;${sender}&gt;&nbsp;&nbsp;${body}`
      console.log(message.innerHTML)
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
