import { WORLD_QUERY } from '../../../lib/graphql'
import { Hint } from '../../Utils'
import sharedStyles from '../../../containers/sharedStyles.module.css'
import crosshair from '../../../assets/gui/crosshair.png'

import classes from './minejs.module.css'

import React, { useCallback, useRef, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import MineJS from 'core/game'
import { useQuery, useApolloClient } from '@apollo/react-hooks'

const Game = ({ id: worldId, username, history }) => {
  const blocker = useRef(null)
  const button = useRef(null)
  const container = useRef(null)
  const canvas = useRef(null)
  const frameId = useRef(null)

  const terminate = useCallback(() => {
    window.cancelAnimationFrame(frameId)
    frameId.current = null
  }, [frameId])

  const { data: worldData, error, loading } = useQuery(WORLD_QUERY, {
    variables: {
      query: worldId
    },
    fetchPolicy: 'network-only'
  })

  const client = useApolloClient()

  const animate = useCallback(
    game => {
      game.update()

      if (!document.webkitHidden) {
        frameId.current = window.requestAnimationFrame(() => animate(game))
      }
    },
    [frameId]
  )

  const closingHandler = useCallback((ev, game) => {
    game.save()
    ev.preventDefault()
    ev.returnValue = 'Are you sure you want to close?'
  }, [])

  const init = useCallback(
    game => {
      window.addEventListener('resize', game.onWindowResize, false)
      window.addEventListener(
        'beforeunload',
        ev => closingHandler(ev, game),
        false
      )

      if (!frameId.current) {
        frameId.current = window.requestAnimationFrame(() => animate(game))
      }
    },
    [frameId, animate, closingHandler]
  )

  useEffect(() => {
    document.title = 'mine.js'

    if (loading || error) return

    const game = new MineJS(
      worldData,
      username,
      container.current,
      canvas.current,
      blocker.current,
      button.current,
      client
    )

    init(game)

    return () => {
      window.removeEventListener('beforeunload', closingHandler, false)
      game.save()
      game.terminate()
      terminate()
    }
  }, [
    client,
    closingHandler,
    error,
    init,
    loading,
    terminate,
    username,
    worldData
  ])

  if (loading) {
    return <Hint text="Loading world..." />
  }

  if (error || !worldData) {
    return (
      <div className={classes.world_not_found}>
        <Hint text="World not found..." />
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => history.push('/game/start')}
        >
          Home
        </button>
      </div>
    )
  }

  return (
    <div className={classes.wrapper} ref={container}>
      <canvas className={classes.canvas} ref={canvas} />
      <img className={classes.crosshair} src={crosshair} alt="+" />
      <div className={classes.blocker} ref={blocker}>
        <h1 className={classes.title}>Game Menu</h1>
        <div className={classes.menu}>
          <button type="button" className={sharedStyles.button} ref={button}>
            Back to Game
          </button>
          <div className={classes.moreOptionsWrapper}>
            <div className={classes.optionsGroup}>
              <button
                type="button"
                className={sharedStyles.button}
                onClick={() => history.push('/game/options')}
              >
                Options
              </button>
              <button type="button" className={sharedStyles.button}>
                Get world URL
              </button>
            </div>
          </div>
          <button
            type="button"
            className={sharedStyles.button}
            onClick={() => history.push('/game/start')}
          >
            Save and Quit to Title
          </button>
        </div>
      </div>
    </div>
  )
}

Game.propTypes = {
  history: PropTypes.object.isRequired
}

export default withRouter(Game)
