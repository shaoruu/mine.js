import React from 'react'

export const Hint = ({ text }) => {
	return <div>{text ? text : 'Loading...'}</div>
}
