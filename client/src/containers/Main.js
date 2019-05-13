/** Basis */
import React, { Component } from 'react'

/** React Router */
import { Route, Switch, withRouter, Redirect } from 'react-router-dom'

/** Local Imports */
import Logout from './Logout/Logout'
import Home from './Home/Home'
import Settings from './Settings/Settings'
import Game from './Game/Game'
import Login from './Login/Login'
import Register from './Register/Register'
import Layout from '../hoc/Layout/Layout'

class Main extends Component {
  componentDidMount() {
    window.addEventListener('beforeunload', this.closingHandler, false)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.closingHandler, false)
  }

  closingHandler = ev => {
    ev.preventDefault()
    return (ev.returnValue = 'Are you sure you want to close?')
  }

  render() {
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
          <Route path="/" component={() => <Redirect to="/login" />} />
        </Switch>
      </Layout>
    )
  }
}

export default withRouter(Main)
