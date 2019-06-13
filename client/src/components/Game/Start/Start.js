import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import ReactPannellum from 'react-pannellum'

import classes from './Start.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'
import logo from '../../../assets/gui/MinecraftJS_logo.png'
import panorama from '../../../assets/gui/Panorama.jpg'

const Start = withRouter(props => {
  const { history } = props
  const node = useRef()

  const possibleMessages = [
    'magic!',
    'browser!',
    'beta!',
    'ian13456!',
    'FreshKoala!'
  ]

  useEffect(() => {
    setTimeout(() => (node.current.style.opacity = '1'), 100)
  })

  return (
    <div ref={node} className={classes.wrapper}>
      <ReactPannellum
        id="firstScene"
        sceneId="firstScene"
        imageSource={panorama}
        className={classes.panorama}
        config={{
          autoRotate: -3,
          autoLoad: true,
          showZoomCtrl: false,
          keyboardZoom: false,
          mouseZoom: false,
          draggable: false,
          disableKeyboardCtrl: true,
          showControls: false,
          showFullscreenCtrl: false
        }}
      />
      <div className={classes.logoWrapper}>
        <img src={logo} alt="MinecraftJS" className={classes.logo} />
        <span>
          {possibleMessages[
            Math.floor(Math.random() * possibleMessages.length)
          ].toUpperCase()}
        </span>
      </div>
      <button
        className={`${sharedStyles.button} ${classes.play}`}
        onClick={() => history.push('/game/worlds')}
      >
        Singleplayer
      </button>
      <button
        className={`${classes.button} ${classes.play} ${classes.coming_soon}`}
        disabled
      >
        Multiplayer (COMING SOON)
      </button>
      <div className={classes.options}>
        <button
          className={`${sharedStyles.button} ${classes.options_butt}`}
          onClick={() => history.push('/game/options')}
        >
          Options
        </button>
        <button
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
