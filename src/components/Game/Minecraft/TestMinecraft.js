import { WORLD_QUERY } from '../../../lib/graphql'
import { Hint } from '../../Utils'

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

const HomeButton = styled.button`
  position: fixed;
  z-index: 5;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 60px;
  margin: 20px;
  border: 2px solid green;
  border-radius: 50%;
  background: black;
  color: white;
  font-family: Minecraft, sans-serif;
  font-weight: 100;
  text-align: center;
  vertical-align: center;
  transition: width 0.2s ease, height 0.2s ease;
  &:hover {
    width: 70px;
    height: 70px;
    background: white;
    color: black;
  }
  &:active {
    outline: 0;
  }
`

const MainScene = styled.div`
  width: 100%;
  height: 100%;
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
  const container = useRef(null)
  const blocker = useRef(null)

  const { data: worldData, error, loading } = useQuery(WORLD_QUERY, {
    variables: {
      query: worldId
    },
    fetchPolicy: 'network-only'
  })

  const client = useApolloClient()

  useEffect(() => {
    if (loading || error) return

    game = new SkyFactory(worldData, username, container.current, blocker.current, client)

    const copiedContainer = container.current

    init()

    return () => {
      terminate()
      if (copiedContainer) copiedContainer.removeChild(game.renderer.threeRenderer.domElement)
      window.removeEventListener('beforeunload', closingHandler, false)
    }
  })

  if (loading) return <Hint text="Loading world..." />
  if (error) return <Hint text="An error occurred..." />

  return (
    <GameWrapper>
      <HomeButton type="button" onClick={() => history.push('/home')}>
        HUB
      </HomeButton>
      <MainScene ref={container}>
        <Blocker ref={blocker} />
      </MainScene>
    </GameWrapper>
  )
}

Game.propTypes = {
  history: PropTypes.object.isRequired
}

export default withRouter(Game)
