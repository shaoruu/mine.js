import { signout, removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

import React, { Component } from 'react'
import { ApolloConsumer } from 'react-apollo'
import { Redirect } from 'react-router-dom'

class Logout extends Component {
  componentDidMount() {
    document.title = 'MC.JS - Logout'
  }

  render() {
    const { isAuth } = this.props

    return (
      <ApolloConsumer>
        {client => {
          if (process.browser) if (isAuth) signout(client)
          removeAllCookies()
          return <Redirect to="/home" />
        }}
      </ApolloConsumer>
    )
  }
}

export default withAuthGuard(Logout)
