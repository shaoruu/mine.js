import { signout, removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

import React, { useEffect } from 'react'
import { useApolloClient } from '@apollo/react-hooks'
import { Redirect } from 'react-router-dom'

const Logout = ({ isAuth }) => {
  useEffect(() => {
    document.title = 'mine.js - home'
  }, [])

  const client = useApolloClient()

  if (process.browser && isAuth) {
    signout(client)
  }

  removeAllCookies()

  return <Redirect to="/home" />
}

export default withAuthGuard(Logout)
