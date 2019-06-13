import React, { Component } from 'react'
import { Query, Mutation } from 'react-apollo'
import { withRouter } from 'react-router'

import { MY_WORLDS_QUERY, DELETE_WORLD_MUTATION } from '../../../lib/graphql'
import WorldList from './WorldList/WorldList'
import CreateNewWorld from './Buttons/CreateNewWorld/CreateNewWorld'
import { Hint } from '../../Utils'
import classes from './Worlds.module.css'
import sharedStyles from '../../../containers/sharedStyles.module.css'

class Worlds extends Component {
  state = {
    selectedIndex: null
  }

  setSelectedIndex = i => this.setState({ selectedIndex: i })

  render() {
    const { selectedIndex } = this.state

    const { subpage, history } = this.props

    return (
      <Query query={MY_WORLDS_QUERY} onError={err => console.error(err)}>
        {({ loading, data }) => {
          if (loading) return <Hint />

          let render = null
          switch (subpage) {
            case 'create':
              render = <CreateNewWorld />
              break
            case undefined:
            case '':
              const { myWorlds } = data

              render = (
                <div className={classes.wrapper}>
                  <h1 className={classes.title}>Select World</h1>
                  <WorldList
                    data={myWorlds}
                    setSelectedIndex={this.setSelectedIndex}
                    selectedIndex={selectedIndex}
                  />
                  <div className={classes.buttonGroupGroup}>
                    <div className={classes.buttonGroup}>
                      <button
                        id="play-selected-world"
                        className={sharedStyles.button}
                        disabled={!selectedIndex}
                        onClick={() => {
                          history.push(`/game/minecraft/${selectedIndex}`)
                          console.log('shit')
                        }}
                      >
                        Play Selected World
                      </button>
                      <button
                        className={sharedStyles.button}
                        onClick={() => history.push('/game/worlds/create')}
                      >
                        Create New World
                      </button>
                    </div>
                    <div className={classes.buttonGroup}>
                      <Mutation mutation={DELETE_WORLD_MUTATION}>
                        {deleteWorld => (
                          <button
                            id="delete"
                            className={sharedStyles.button}
                            disabled={!selectedIndex}
                            onClick={() => {
                              deleteWorld({
                                variables: {
                                  worldId: selectedIndex
                                },
                                refetchQueries: [{ query: MY_WORLDS_QUERY }]
                              })
                              this.setSelectedIndex(null)
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </Mutation>

                      <button
                        className={sharedStyles.button}
                        onClick={() => history.push('/game/start')}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )
              break
            default:
              break
          }

          return render
        }}
      </Query>
    )
  }
}

export default withRouter(Worlds)
