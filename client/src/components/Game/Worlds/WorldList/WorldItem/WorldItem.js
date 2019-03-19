import React from 'react'
import { Link } from 'react-router-dom'

export default ({ id, name, seed }) => {
	return (
		<li>
			<Link to={`/game/minecraft/${id}`}>
				{name}:{seed}
			</Link>
		</li>
	)
}
