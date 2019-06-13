/**
 * SETTINGS PAGE
 * - REPRESENTS: LAUNCHER SETTINGS
 */

import React from 'react'
import { withRouter } from 'react-router'

import classes from './Settings.module.css'
import sharedStyles from '../sharedStyles.module.css'

const Settings = ({ history }) => {
  return (
    <div className={classes.wrapper}>
      <h1>Settings [COMING SOON]</h1>
      <button className={sharedStyles.button} onClick={() => history.goBack()}>
        Go Back
      </button>
    </div>
  )
}

export default withRouter(Settings)
