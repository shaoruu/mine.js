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

class Main extends Component {
	render() {
		return (
			<Switch>
				<Route path="/logout" component={Logout} />
				<Route path="/home" component={Home} />
				<Route path="/settings" component={Settings} />
				<Route path="/game" component={Game} />
				<Route path="/login" component={Login} />
				<Route path="/register" component={Register} />
				<Route path="/home" component={Home} />
				<Route path="/" component={() => <Redirect to="/login" />} />
			</Switch>
		)
	}
}

export default withRouter(Main)
