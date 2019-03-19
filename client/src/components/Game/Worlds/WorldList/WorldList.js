import React from 'react'
import WorldItem from './WorldItem/WorldItem'

export default ({ data: worlds }) => {
	return worlds.length ? (
		<ul>
			{worlds.map(ele => (
				<WorldItem key={ele.id} {...ele} />
			))}
		</ul>
	) : (
		<h1>no world</h1>
	)
}
