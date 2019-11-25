import sharedStyles from '../sharedStyles.module.css'

import classes from './Settings.module.css'

import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'

const Settings = ({ history }) => {
  useEffect(() => {
    document.title = 'mine.js - settings'
  }, [])

  return (
    <div className={classes.wrapper}>
      <h1>Settings [COMING SOON]</h1>
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

export default withRouter(Settings)
