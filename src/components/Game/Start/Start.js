import sharedStyles from '../../../containers/sharedStyles.module.css'
import logo from '../../../assets/gui/MCJS_logo.png'

import Pannellum from './Elements/Pannellum'
import classes from './Start.module.css'

import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'

const possiblePanoramas = 3

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

  const panoramaId = 'panorama-background'

  const panoramaArray = []

  useEffect(() => {
    document.title = 'MC.JS - Start'

    setTimeout(() => (node.current.style.opacity = '1'), 100)
  })

  const panoramaIndex = Math.floor(Math.random() * possiblePanoramas)

  for (let i = 0; i < 6; i++)
    panoramaArray.push(
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require(`../../../assets/gui/panoramas/${panoramaIndex}/panorama${i}.png`)
    )

  return (
    <div ref={node} className={classes.wrapper}>
      <Pannellum
        id={panoramaId}
        width="600px"
        height="400px"
        type="cubemap"
        cubeMap={panoramaArray}
        autoLoad
        autoRotate={-2}
        disableKeyboardCtrl
        className={classes.panorama}
      />
      <div className={classes.logoWrapper}>
        <img src={logo} alt="MCJS" className={classes.logo} />
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
        Singleplayer
      </button>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.play}`}
        onClick={() => history.push('/game/multiplayer')}
      >
        Multiplayer
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
