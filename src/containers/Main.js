import Layout from '../hoc/Layout/Layout'

import Logout from './Logout/Logout'
import Home from './Home/Home'
import Settings from './Settings/Settings'
import Game from './Game/Game'
import Login from './Login/Login'
import Register from './Register/Register'

import { Route, Switch, withRouter, Redirect } from 'react-router-dom'
import React from 'react'

const Main = () => {
  return (
    <Layout>
      <Switch>
        <Route path="/logout" component={Logout} />
        <Route path="/home" component={Home} />
        <Route path="/settings" component={Settings} />
        <Route path="/game/:page?/:query?" component={Game} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/home" component={Home} />
        <Route path="/" component={() => <Redirect to="/home" />} />
      </Switch>
    </Layout>
  )
}

export default withRouter(Main)
