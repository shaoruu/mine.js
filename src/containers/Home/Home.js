/**
 * HOME PAGE
 * - REPRESENTS: LAUNCHER HOME
 */

import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

import classes from './Home.module.css'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'
import lobby from '../../assets/gui/MinecraftJS_lobby.png'
import sharedStyles from '../sharedStyles.module.css'

class Home extends Component {
  componentDidMount() {
    document.title = 'MinecraftJS - Home'
  }

  render() {
    const { isAuth, history, username, loading } = this.props

    if (loading) return <Hint />

    const content = isAuth ? (
      <div className={classes.wrapper}>
        <button
          className={`${sharedStyles.button} ${classes.button}`}
          onClick={() => history.push('/game')}
        >
          Game
        </button>
        <button
          className={`${sharedStyles.button} ${classes.button}`}
          onClick={() => history.push('/settings')}
        >
          Settings
        </button>
        <button
          className={`${sharedStyles.button} ${classes.button}`}
          onClick={() => history.push('/logout')}
        >
          Logout ({username})
        </button>
      </div>
    ) : (
      <div className={classes.wrapper}>
        <button
          className={`${sharedStyles.button} ${classes.button}`}
          onClick={() => history.push('/login')}
        >
          Login
        </button>
        <button
          className={`${sharedStyles.button} ${classes.button}`}
          onClick={() => history.push('/register')}
        >
          Register
        </button>
      </div>
    )

    return (
      <div>
        <img src={lobby} alt="MinecraftJS Lobby" className={classes.logo} />
        {content}
      </div>
    )
  }
}

export default withAuthGuard(withRouter(Home))
