import React from 'react'

export default ({ id, name, seed }) => {
	return (
		<li>
			{name}:{seed}
		</li>
	)
}
