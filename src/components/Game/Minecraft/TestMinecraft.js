import { WORLD_QUERY } from '../../../lib/graphql'
import { Hint } from '../../Utils'

import classes from './TestMinecraft.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'

import React, { useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import SkyFactory from 'core/game'
import { useQuery, useApolloClient } from 'react-apollo-hooks'

const GameWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const Blocker = styled.div`
  display: flex;
  position: absolute;
  z-index: 4;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
`

const MainCanvas = styled.canvas`
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 100%;
`

let game
let frameId

const animate = () => {
  game.update()
  if (!document.webkitHidden) {
    frameId = window.requestAnimationFrame(animate)
  }
}

const closingHandler = ev => {
  ev.preventDefault()
  ev.returnValue = 'Are you sure you want to close?'
}

const init = () => {
  window.addEventListener('resize', game.onWindowResize, false)
  window.addEventListener('beforeunload', closingHandler, false)

  if (!frameId) frameId = window.requestAnimationFrame(animate)
}

const terminate = () => {
  window.cancelAnimationFrame(frameId)
  frameId = undefined
}

const Game = ({ id: worldId, username, history }) => {
  const blocker = useRef(null)
  const button = useRef(null)
  const container = useRef(null)
  const canvas = useRef(null)

  const { data: worldData, error, loading } = useQuery(WORLD_QUERY, {
    variables: {
      query: worldId
    },
    fetchPolicy: 'network-only'
  })

  const client = useApolloClient()

  useEffect(() => {
    if (loading || error) return

    game = new SkyFactory(
      worldData,
      username,
      container.current,
      canvas.current,
      blocker.current,
      button.current,
      client
    )

    init()

    return () => {
      terminate()
      window.removeEventListener('beforeunload', closingHandler, false)
    }
  })

  if (loading) return <Hint text="Loading world..." />
  if (error || !worldData)
    return (
      <div className={classes.world_not_found}>
        <Hint text="World not found..." />
        <button className={sharedStyles.button} onClick={() => history.push('/game/start')}>
          Home
        </button>
      </div>
    )

  return (
    <GameWrapper ref={container}>
      <MainCanvas ref={canvas}></MainCanvas>
      <Blocker ref={blocker}>
        <h1 className={classes.title}>Game Menu</h1>
        <div className={classes.menu}>
          <button className={sharedStyles.button} ref={button}>
            Back to Game
          </button>
          <button className={sharedStyles.button} onClick={() => history.push('/game/start')}>
            Save and Quit to Title
          </button>
        </div>
      </Blocker>
    </GameWrapper>
  )
}

Game.propTypes = {
  history: PropTypes.object.isRequired
}

export default withRouter(Game)
