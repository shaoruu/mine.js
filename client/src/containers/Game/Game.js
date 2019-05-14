/**
 * GAME PAGE
 * - REPRESENTS: MINECRAFT.JAVA
 */

import React, { Component } from 'react'
import { withRouter, Redirect } from 'react-router-dom'

import { Minecraft, Start, Worlds, Options } from '../../components/Game'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'

class Game extends Component {
  render() {
    const {
      isAuth,
      match: {
        params: { page, query }
      },
      loading,
      username
    } = this.props

    if (loading) return <Hint />
    if (!isAuth) return <Redirect to="/login" />

    let render = null
    switch (page) {
      case 'minecraft':
        render = <Minecraft id={query} username={username} />
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

    return render
  }
}

export default withAuthGuard(withRouter(Game))
