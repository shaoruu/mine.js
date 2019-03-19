/**
 * SETTINGS PAGE
 * - REPRESENTS: LAUNCHER SETTINGS
 */

import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

class Settings extends Component {
	render() {
		return <h1>Settings</h1>
	}
}

export default withAuthGuard(withRouter(Settings))
