import React, { Component } from 'react'
import { Query } from 'react-apollo'
import { withRouter } from 'react-router'

import { MY_WORLDS_QUERY } from '../../../lib/graphql'
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
      <Query
        query={MY_WORLDS_QUERY}
        onError={err => console.error(err)}
        fetchPolicy="network-only"
      >
        {({ loading, data }) => {
          if (loading) return <Hint />

          const { myWorlds } = data

          const selectionStyle = [classes.button]
          if (selectedIndex !== 0 && !selectedIndex)
            selectionStyle.push(classes.disabledButton)
          else {
            selectionStyle.length = 0
            selectionStyle.push(sharedStyles.button)
          }

          let render = null
          switch (subpage) {
            case 'create':
              render = <CreateNewWorld />
              break
            case undefined:
            case '':
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
                        className={selectionStyle.join(' ')}
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
                      <button id="delete" className={selectionStyle.join(' ')}>
                        Delete
                      </button>
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
