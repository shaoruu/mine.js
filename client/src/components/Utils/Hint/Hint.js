import React from 'react'

import classes from './Hint.module.css'

export const Hint = ({ text }) => {
  return <div className={classes.wrapper}>{text ? text : 'Loading.'}</div>
}
