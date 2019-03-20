import React from 'react'
import WorldItem from './WorldItem/WorldItem'

export default ({ data: worlds }) => {
	return worlds.length ? (
		<div>
			<h3>Worlds</h3>
			<ul>
				{worlds.map(ele => (
					<WorldItem key={ele.id} {...ele} />
				))}
			</ul>
		</div>
	) : (
		<h1>no world</h1>
	)
}
