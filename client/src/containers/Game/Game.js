/**
 * GAME PAGE
 * - REPRESENTS: MINECRAFT.JAVA
 */

import React, { Component } from 'react'
import { withRouter, Redirect } from 'react-router-dom'

import { Minecraft, Start, Worlds, Options } from '../../components/Game'

class Game extends Component {
	render() {
		const {
			match: {
				params: { page, query }
			}
		} = this.props

		let render = null
		switch (page) {
			case 'minecraft':
				render = <Minecraft id={query} />
				break
			case 'worlds':
				render = <Worlds subpage={query} />
				break
			case 'start':
				render = <Start />
				break
			case 'options':
				render = <Options />
				break
			default:
				render = <Redirect to="/game/start" />
				break
		}

		return render
	}
}

export default withRouter(Game)
