/**
 * HOME PAGE
 * - REPRESENTS: LAUNCHER HOME
 */

import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'
import lobby from '../../assets/gui/minejs_appLogo.png'
import sharedStyles from '../sharedStyles.module.css'

import classes from './Home.module.css'

import { withRouter } from 'react-router-dom'
import React, { useEffect } from 'react'

const Home = ({ isAuth, history, username, loading }) => {
  useEffect(() => {
    document.title = 'mine.js - home'
  }, [])

  if (loading) {
    return <Hint />
  }

  const content = isAuth ? (
    <div className={classes.wrapper}>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.button}`}
        onClick={() => history.push('/game')}
      >
        Game
      </button>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.button}`}
        onClick={() => history.push('/settings')}
      >
        Settings
      </button>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.button}`}
        onClick={() => history.push('/logout')}
      >
        {`Logout (${username})`}
      </button>
    </div>
  ) : (
    <div className={classes.wrapper}>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.button}`}
        onClick={() => history.push('/login')}
      >
        Login
      </button>
      <button
        type="button"
        className={`${sharedStyles.button} ${classes.button}`}
        onClick={() => history.push('/register')}
      >
        Register
      </button>
    </div>
  )

  return (
    <div className={classes.wrapper}>
      <img src={lobby} alt="mine.js Lobby" className={classes.logo} />
      {content}
    </div>
  )
}

export default withAuthGuard(withRouter(Home))
