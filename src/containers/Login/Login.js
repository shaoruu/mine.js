import { removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import LoginForm from '../../components/Forms/LoginForm/LoginForm'

import { Redirect } from 'react-router-dom'
import React, { useEffect } from 'react'

const Login = ({ isAuth }) => {
  useEffect(() => {
    document.title = 'MC.JS - Login'
  })

  if (isAuth) return <Redirect to="/home" />

  removeAllCookies()

  return <LoginForm />
}

export default withAuthGuard(Login)
