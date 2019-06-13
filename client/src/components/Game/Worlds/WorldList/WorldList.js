import React from 'react'

import classes from './WorldList.module.css'
import WorldItem from './WorldItem/WorldItem'

export default ({ data: worlds, selectedIndex, setSelectedIndex }) => (
  <ul className={classes.wrapper}>
    {worlds.map(ele => (
      <WorldItem
        key={ele.id}
        {...ele}
        setSelectedIndex={setSelectedIndex}
        selectedIndex={selectedIndex}
      />
    ))}
  </ul>
)
