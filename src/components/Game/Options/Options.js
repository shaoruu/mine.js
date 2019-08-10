import sharedStyles from '../../../containers/sharedStyles.module.css'
import { Slider, Hint } from '../../Utils'
import { MY_SETTINGS, UPDATE_SETTINGS_MUTATION } from '../../../lib/graphql'

import classes from './Options.module.css'

import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { useQuery, useApolloClient } from 'react-apollo-hooks'

const Options = ({ history }) => {
  const [renderDistance, setRenderDistance] = useState(0)
  const { data, error, loading } = useQuery(MY_SETTINGS, {
    fetchPolicy: 'network-only'
  })
  const client = useApolloClient()

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
          className={classes.slider}
          value={renderDistance}
          onChange={handleRenderDistance}
          min="2"
          max="6"
          step="0.1"
          text="Render Distance"
          unit="chunk"
        />
        <Hint
          text="More settings coming."
          style={{ fontSize: 10, color: 'gray' }}
        />
      </div>
      <button
        type="button"
        className={sharedStyles.button}
        onClick={() => {
          const settings = { renderDistance: Math.round(renderDistance) }
          client
            .mutate({
              mutation: UPDATE_SETTINGS_MUTATION,
              variables: {
                id: data.me.settings.id,
                ...settings
              }
            })
            .then(() => history.goBack())
        }}
      >
        Done
      </button>
    </div>
  )
}

export default withRouter(Options)
