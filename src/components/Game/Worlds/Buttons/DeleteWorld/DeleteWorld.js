import { Hint } from '../../../../Utils'
import sharedStyles from '../../../../../containers/sharedStyles.module.css'
import {
  MINI_WORLD_QUERY,
  DELETE_WORLD_MUTATION,
  MY_WORLDS_QUERY
} from '../../../../../lib/graphql'

import classes from './DeleteWorld.module.css'

import React from 'react'
import { withRouter, Redirect } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/react-hooks'

const DeleteWorld = ({ history, location }) => {
  const { worldId } = location.state

  const { data, loading } = useQuery(MINI_WORLD_QUERY, {
    variables: {
      where: {
        id: worldId
      }
    }
  })

  const [deleteWorld] = useMutation(DELETE_WORLD_MUTATION, {
    onCompleted: () => history.push('/game/worlds')
  })

  if (!worldId) {
    return <Redirect to="/game/worlds" />
  }

  if (loading) {
    return <Hint />
  }

  const { world } = data || {}

  if (!world) {
    history.push('/game/worlds')
    return null
  }

  const { name } = world

  return (
    <div className={classes.wrapper}>
      <p>Are you sure you want to delete this world?</p>
      <p className={classes.title}>
        {`'${
          name.length > 15 ? `${name.substring(0, 15)}...` : name
        }' will be lost forever! (A long time!)`}
      </p>

      <div className={classes.buttonWrapper}>
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => {
            deleteWorld({
              variables: {
                worldId
              },
              refetchQueries: [{ query: MY_WORLDS_QUERY }]
            })
          }}
        >
          Delete
        </button>
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => history.push('/game/worlds')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default withRouter(DeleteWorld)
