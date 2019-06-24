import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
// import ReactPannellum from 'react-pannellum/libs/pannellum'

import './Pannellum/Pannellum.css'
import pannellum from './Pannellum/Pannellum'
import classes from './Start.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'
import logo from '../../../assets/gui/MinecraftJS_logo.png'

import p0_0 from '../../../assets/gui/panoramas/0/panorama0.png'
import p0_1 from '../../../assets/gui/panoramas/0/panorama1.png'
import p0_2 from '../../../assets/gui/panoramas/0/panorama2.png'
import p0_3 from '../../../assets/gui/panoramas/0/panorama3.png'
import p0_4 from '../../../assets/gui/panoramas/0/panorama4.png'
import p0_5 from '../../../assets/gui/panoramas/0/panorama5.png'

import p1_0 from '../../../assets/gui/panoramas/0/panorama0.png'
import p1_1 from '../../../assets/gui/panoramas/0/panorama1.png'
import p1_2 from '../../../assets/gui/panoramas/0/panorama2.png'
import p1_3 from '../../../assets/gui/panoramas/0/panorama3.png'
import p1_4 from '../../../assets/gui/panoramas/0/panorama4.png'
import p1_5 from '../../../assets/gui/panoramas/0/panorama5.png'

const possiblePanoramas = [
  [p0_0, p0_1, p0_2, p0_3, p0_4, p0_5],
  [p1_0, p1_1, p1_2, p1_3, p1_4, p1_5]
]

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

  const panoramaId = 'background'

  useEffect(() => {
    setTimeout(() => (node.current.style.opacity = '1'), 100)
    pannellum.viewer(panoramaId, {
      type: 'cubemap',
      cubeMap:
        possiblePanoramas[Math.floor(Math.random() * possiblePanoramas.length)],
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
