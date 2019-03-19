import React from 'react'
import { withRouter } from 'react-router-dom'

const Start = withRouter(props => {
	const { history } = props
	return (
		<div>
			<h1>Minecraft</h1>
			<div>
				<button onClick={() => history.push('/game/worlds')}>
					Single Player
				</button>
				<button onClick={() => history.push('/game/options')}>Options</button>
				<button onClick={() => history.push('/home')}>Quit Game</button>
			</div>
		</div>
	)
})

export { Start }
