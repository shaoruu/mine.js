/**
 * GAME PAGE
 * - REPRESENTS: MINECRAFT.JAVA
 */

import React, { Component } from 'react'
import { withRouter, Redirect } from 'react-router-dom'

import { Minecraft, Start, WorldList, Options } from '../../components/Game'

class Game extends Component {
	render() {
		const {
			match: {
				params: { page }
			}
		} = this.props

		let render = null
		switch (page) {
			case 'minecraft':
				render = <Minecraft />
				break
			case 'worlds':
				render = <WorldList />
				break
			case 'start':
				render = <Start />
				break
			case 'options':
				render = <Options />
				break
			default:
				break
		}

		if (!render) return <Redirect to="/game/start" />

		return render
	}
}

export default withRouter(Game)
