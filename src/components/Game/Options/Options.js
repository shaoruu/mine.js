import sharedStyles from '../../../containers/sharedStyles.module.css'

import classes from './Options.module.css'

import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

const Options = ({ history }) => {
  useEffect(() => {
    document.title = 'MC.JS - Options'
  })

  return (
    <div className={classes.wrapper}>
      <h1>Options [COMING SOON]</h1>
      <button
        type="button"
        className={sharedStyles.button}
        onClick={() => history.goBack()}
      >
        Go Back
      </button>
    </div>
  )
}

export default withRouter(Options)
