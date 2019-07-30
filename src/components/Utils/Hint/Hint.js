import classes from './Hint.module.css'

import React from 'react'

export const Hint = ({ text }) => {
  return <div className={classes.wrapper}>{text || 'Loading.'}</div>
}
