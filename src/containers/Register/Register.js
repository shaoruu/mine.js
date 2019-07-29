/**
 * REGISTER PAGE
 * - REPRESENTS: MINECRAFT.ORG / MOJANG REGISTRATION
 */

import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { RegisterForm } from '../../components/Forms'

import { Redirect } from 'react-router-dom'
import React, { useEffect } from 'react'

const Register = ({ isAuth }) => {
  useEffect(() => {
    document.title = 'MinecraftJS - Register'
  })

  if (isAuth) return <Redirect to="/home" />

  return <RegisterForm />
}

export default withAuthGuard(Register)
