import React from 'react'
import OutsideClickHandler from 'react-outside-click-handler'
import { withRouter } from 'react-router'

import classes from './WorldItem.module.css'

export default withRouter(
  ({ lastPlayed, id, name, history, setSelectedIndex, selectedIndex }) => {
    return (
      <OutsideClickHandler
        onOutsideClick={e => {
          if (
            selectedIndex &&
            !['play-selected-world', 'delete'].includes(e.target.id)
          )
            setSelectedIndex(null)
        }}
      >
        <li
          className={classes.world_item}
          onClick={() => {
            setSelectedIndex(id)
          }}
          onDoubleClick={() => {
            history.push(`/game/minecraft/${id}`)
          }}
          style={selectedIndex === id ? { borderColor: 'white' } : null}
        >
          <h1>{name}</h1>
          <p>{new Date(lastPlayed).toLocaleString()}</p>
        </li>
      </OutsideClickHandler>
    )
  }
)
