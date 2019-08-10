import sharedStyles from '../../../containers/sharedStyles.module.css'
import { Slider, Hint } from '../../Utils'

import classes from './Options.module.css'

import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'

const Options = ({ history }) => {
  const [renderDistance, setRenderDistance] = useState(1)

  useEffect(() => {
    document.title = 'MC.JS - Options'
  })

  const handleRenderDistance = e => {
    setRenderDistance(e.target.value)
  }

  return (
    <div className={classes.wrapper}>
      <h1 className={classes.title}>Options</h1>
      <div className={classes.optionsWrapper}>
        <Slider
          value={renderDistance}
          onChange={handleRenderDistance}
          min="1"
          max="5"
          step="0.1"
          text="Render Distance"
          unit="chunk"
        />
      </div>
      <Hint
        text="More settings coming."
        style={{ fontSize: 10, color: 'gray' }}
      />
      <button
        type="button"
        className={sharedStyles.button}
        onClick={() => history.goBack()}
      >
        Done
      </button>
    </div>
  )
}

export default withRouter(Options)
