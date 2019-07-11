import React, { Component } from 'react'

import classes from './Layout.module.css'
import background from '../../assets/gui/options_background.png'

class Layout extends Component {
  render() {
    return (
      <div style={{ backgroundImage: `url(${background})` }} className={classes.layout__wrapper}>
        {this.props.children}
      </div>
    )
  }
}

export default Layout
