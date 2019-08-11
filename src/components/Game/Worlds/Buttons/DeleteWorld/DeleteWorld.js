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
import { Query, Mutation } from 'react-apollo'

const DeleteWorld = ({ history, location }) => {
  const { worldId } = location.state

  if (!worldId) return <Redirect to="/game/worlds" />

  return (
    <Query
      query={MINI_WORLD_QUERY}
      variables={{
        where: {
          id: worldId
        }
      }}
    >
      {({ loading, data }) => {
        if (loading) return <Hint />

        const {
          world: { name }
        } = data

        return (
          <div className={classes.wrapper}>
            <p>Are you sure you want to delete this world?</p>
            <p className={classes.title}>
              {`'${
                name.length > 15 ? `${name.substring(0, 15)}...` : name
              }' will be lost forever! (A long time!)`}
            </p>

            <div className={classes.buttonWrapper}>
              <Mutation
                mutation={DELETE_WORLD_MUTATION}
                onCompleted={() => history.push('/game/worlds')}
              >
                {deleteWorld => (
                  <button
                    type="button"
                    className={sharedStyles.button}
                    onClick={() => {
                      deleteWorld({
                        variables: {
                          worldId
                        },
                        refetchQueries: [
                          {
                            where: {
                              id: MY_WORLDS_QUERY
                            }
                          }
                        ]
                      })
                    }}
                  >
                    Delete
                  </button>
                )}
              </Mutation>
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
      }}
    </Query>
  )
}

export default withRouter(DeleteWorld)
