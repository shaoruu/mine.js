import { removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import LoginForm from '../../components/Forms/LoginForm/LoginForm'

import { Redirect } from 'react-router-dom'
import React, { useEffect } from 'react'

const Login = ({ isAuth }) => {
  useEffect(() => {
    document.title = 'MC.JS - Login'
    removeAllCookies()
  }, [])

  if (isAuth) {
    return <Redirect to="/home" />
  }

  return <LoginForm />
}

export default withAuthGuard(Login)
