/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events  */
import classes from './WorldItem.module.css'

import React from 'react'
import OutsideClickHandler from 'react-outside-click-handler'
import { withRouter } from 'react-router-dom'

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
            history.push(`/game/minejs/${id}`)
          }}
          style={
            selectedIndex === id
              ? { borderColor: 'rgba(173, 173, 173, 0.74)' }
              : null
          }
        >
          <h1>{name}</h1>
          <p>{new Date(lastPlayed).toLocaleString()}</p>
        </li>
      </OutsideClickHandler>
    )
  }
)
