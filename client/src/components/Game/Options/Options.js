import React from 'react'
import { withRouter } from 'react-router'

import classes from './Options.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'

const Options = ({ history }) => {
  return (
    <div className={classes.wrapper}>
      <h1>Options [COMING SOON]</h1>
      <button className={sharedStyles.button} onClick={() => history.goBack()}>
        Go Back
      </button>
    </div>
  )
}

export default withRouter(Options)
