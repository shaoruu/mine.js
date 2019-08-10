import classes from './Hint.module.css'

import React from 'react'

export const Hint = ({ text, style }) => {
  return (
    <div className={classes.wrapper} style={style}>
      {text || 'Loading.'}
    </div>
  )
}
