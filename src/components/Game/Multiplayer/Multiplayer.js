import sharedStyles from '../../../containers/sharedStyles.module.css'

import classes from './Multiplayer.module.css'

import React, { useState } from 'react'
import { withRouter } from 'react-router-dom'

const Multiplayer = ({ history }) => {
  const [address, setAddress] = useState('')

  const onChange = e => setAddress(e.target.value)

  return (
    <div className={classes.wrapper}>
      <h1 className={classes.title}>Connect</h1>
      <div className={sharedStyles.inputField}>
        <p>World Address</p>
        <input value={address} type="text" onChange={onChange} />
      </div>
      <div className={classes.buttonWrapper}>
        <button type="button" className={sharedStyles.button} disabled={!address}>
          Join World
        </button>
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => history.push('/game/start')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default withRouter(Multiplayer)
