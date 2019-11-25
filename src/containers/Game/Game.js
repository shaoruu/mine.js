import {
  MineJS,
  Start,
  Worlds,
  Options,
  Multiplayer
} from '../../components/Game'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'
import bg from '../../assets/gui/options_background_2.png'

import classes from './Game.module.css'

import { withRouter, Redirect } from 'react-router-dom'
import React from 'react'

const Game = ({
  isAuth,
  match: {
    params: { page, query }
  },
  loading,
  username
}) => {
  if (loading) {
    return <Hint />
  }

  if (!isAuth) {
    return <Redirect to="/login" />
  }

  let render = null
  switch (page) {
    case 'minejs':
      render = <MineJS id={query} username={username} />
      break
    case 'multiplayer':
      render = <Multiplayer subpage={query} />
      break
    case 'worlds':
      render = <Worlds subpage={query} />
      break
    case 'start':
      render = <Start />
      break
    case 'options':
      render = <Options />
      break
    default:
      render = <Redirect to="/game/start" />
      break
  }

  return (
    <div style={{ backgroundImage: `url(${bg})` }} className={classes.wrapper}>
      {render}
    </div>
  )
}

export default withAuthGuard(withRouter(Game))
