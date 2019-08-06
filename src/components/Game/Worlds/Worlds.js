import { MY_WORLDS_QUERY } from '../../../lib/graphql'
import { Hint } from '../../Utils'
import sharedStyles from '../../../containers/sharedStyles.module.css'

import WorldList from './WorldList/WorldList'
import CreateNewWorld from './Buttons/CreateNewWorld/CreateNewWorld'
import classes from './Worlds.module.css'
import DeleteWorld from './Buttons/DeleteWorld/DeleteWorld'

import React, { useState, useEffect } from 'react'
import { Query, withApollo } from 'react-apollo'
import { withRouter, Redirect } from 'react-router-dom'

const Worlds = ({ history, subpage }) => {
  const [selectedIndex, setSelectedIndex] = useState(null)

  const escHandler = e => {
    if (e.keyCode === 27) {
      document.removeEventListener('keydown', escHandler, false)
      history.push('/game/start')
    }
  }

  useEffect(() => {
    document.title = 'MC.JS - Worlds'

    document.addEventListener('keydown', escHandler, false)

    return () => {
      document.removeEventListener('keydown', escHandler, false)
    }
  })

  switch (subpage) {
    case 'create':
      return <CreateNewWorld />
    case 'delete':
      return <DeleteWorld />
    case '':
    case undefined:
      return (
        // eslint-disable-next-line no-console
        <Query
          query={MY_WORLDS_QUERY}
          // eslint-disable-next-line no-console
          onError={err => console.error(err)}
          fetchPolicy="network-only"
        >
          {({ loading, data }) => {
            if (loading) return <Hint />

            const {
              myWorlds: { worlds: myWorlds }
            } = data
            myWorlds.sort((a, b) => {
              return new Date(b.lastPlayed) - new Date(a.lastPlayed)
            })

            return (
              <div className={classes.wrapper}>
                <h1 className={classes.title}>Select World</h1>
                <WorldList
                  data={myWorlds}
                  setSelectedIndex={setSelectedIndex}
                  selectedIndex={selectedIndex}
                />
                <div className={classes.buttonGroupGroup}>
                  <div className={classes.buttonGroup}>
                    <button
                      type="button"
                      id="play-selected-world"
                      className={sharedStyles.button}
                      disabled={!selectedIndex}
                      onClick={() => {
                        history.push(`/game/mcjs/${selectedIndex}`)
                      }}
                    >
                      Play Selected World
                    </button>
                    <button
                      type="button"
                      className={sharedStyles.button}
                      onClick={() =>
                        history.push({
                          pathname: '/game/worlds/create',
                          state: {
                            worldId: selectedIndex
                          }
                        })
                      }
                    >
                      Create New World
                    </button>
                  </div>
                  <div className={classes.buttonGroup}>
                    <button
                      type="button"
                      id="delete"
                      className={sharedStyles.button}
                      disabled={!selectedIndex}
                      onClick={() =>
                        history.push({
                          pathname: '/game/worlds/delete',
                          state: { worldId: selectedIndex }
                        })
                      }
                    >
                      Delete
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
              </div>
            )
          }}
        </Query>
      )
    default:
      break
  }

  return <Redirect to="/game/worlds" />
}

export default withApollo(withRouter(Worlds))
