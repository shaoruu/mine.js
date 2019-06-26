import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'

import './Pannellum/Pannellum.css'
import pannellum from './Pannellum/Pannellum'
import classes from './Start.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'
import logo from '../../../assets/gui/MinecraftJS_logo.png'

const possiblePanoramas = 3

const possibleMessages = ['magic!', 'browser!', 'beta!', 'ian13456!', 'FreshKoala!']

const Start = withRouter(props => {
  const { history } = props
  const node = useRef()

  const panoramaId = 'background'

  useEffect(() => {
    setTimeout(() => (node.current.style.opacity = '1'), 100)

    const panoramaIndex = Math.floor(Math.random() * possiblePanoramas)

    const panoramaArray = []

    for (let i = 0; i < 6; i++)
      panoramaArray.push(
        require(`../../../assets/gui/panoramas/${panoramaIndex}/panorama${i}.png`)
      )

    pannellum.viewer(panoramaId, {
      type: 'cubemap',
      cubeMap: panoramaArray,
      autoLoad: true,
      autoRotate: -2,
      showZoomCtrl: false,
      keyboardZoom: false,
      mouseZoom: false,
      draggable: false,
      disableKeyboardCtrl: true,
      showControls: false,
      showFullscreenCtrl: false
    })
  })

  return (
    <div ref={node} className={classes.wrapper}>
      <div
        id={panoramaId}
        className={classes.panorama}
        style={{ width: '600px', height: '400px', background: '#000000' }}
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
        onClick={() => history.push('/game/worlds')}>
        Singleplayer
      </button>
      <button
        className={`${classes.button} ${classes.play} ${classes.coming_soon}`}
        disabled>
        Multiplayer (COMING SOON)
      </button>
      <div className={classes.options}>
        <button
          className={`${sharedStyles.button} ${classes.options_butt}`}
          onClick={() => history.push('/game/options')}>
          Options
        </button>
        <button
          className={`${sharedStyles.button} ${classes.options_butt}`}
          onClick={() => history.push('/home')}>
          Quit Game
        </button>
      </div>
    </div>
  )
})

export default Start
