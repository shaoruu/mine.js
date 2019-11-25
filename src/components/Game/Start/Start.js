import sharedStyles from '../../../containers/sharedStyles.module.css'
import logo from '../../../assets/gui/minejs_logo.png'

import classes from './Start.module.css'

import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'

const possibleMessages = [
  'magic!',
  'browser!',
  'beta!',
  'ian13456!',
  'FreshKoala!'
]

const Start = withRouter(props => {
  const { history } = props
  const node = useRef()

  useEffect(() => {
    document.title = 'mine.js - start'

    setTimeout(() => (node.current.style.opacity = '1'), 100)
  })

  return (
    <div ref={node} className={classes.wrapper}>
      <div className={classes.logoWrapper}>
        <img src={logo} alt="mine.js" className={classes.logo} />
        <span>
          {possibleMessages[
            Math.floor(Math.random() * possibleMessages.length)
          ].toUpperCase()}
        </span>
      </div>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.play}`}
        onClick={() => history.push('/game/worlds')}
      >
        Single Player
      </button>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.play}`}
        onClick={() => history.push('/game/multiplayer')}
      >
        Multi Player
      </button>
      <div className={classes.options}>
        <button
          type="button"
          className={`${sharedStyles.button} ${classes.options_butt}`}
          onClick={() => history.push('/game/options')}
        >
          Options
        </button>
        <button
          type="button"
          className={`${sharedStyles.button} ${classes.options_butt}`}
          onClick={() => history.push('/home')}
        >
          Quit Game
        </button>
      </div>
    </div>
  )
})

export default Start
