import sharedStyles from '../../../containers/sharedStyles.module.css'
import { Slider, Hint } from '../../Utils'
import { MY_SETTINGS } from '../../../lib/graphql'

import classes from './Options.module.css'

import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { useQuery } from 'react-apollo-hooks'

const Options = ({ history }) => {
  const [renderDistance, setRenderDistance] = useState(0)
  const { data, error, loading } = useQuery(MY_SETTINGS)

  useEffect(() => {
    document.title = 'MC.JS - Options'

    if (data) {
      const {
        me: {
          settings: { renderDistance: rd }
        }
      } = data
      setRenderDistance(rd)
    }
  }, [data])

  if (loading) return <Hint />
  if (error) return <Hint text="Something went wrong..." />

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
        onClick={() => {
          // client.mutate({
          //   mutation:
          // })
          history.goBack()
        }}
      >
        Done
      </button>
    </div>
  )
}

export default withRouter(Options)
