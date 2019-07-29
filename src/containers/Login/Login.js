/**
 * LOGIN PAGE
 * - REPRESENTS: LAUNCHER LOGIN
 */

import { removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import LoginForm from '../../components/Forms/LoginForm/LoginForm'

import { Redirect } from 'react-router-dom'
import React, { useEffect } from 'react'

// TODO Componentize login form

const Login = ({ isAuth }) => {
  useEffect(() => {
    document.title = 'MinecraftJS - Login'
  })

  if (isAuth) return <Redirect to="/home" />

  removeAllCookies()

  return <LoginForm />
}

export default withAuthGuard(Login)
