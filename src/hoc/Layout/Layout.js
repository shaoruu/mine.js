import classes from './Layout.module.css'

import React from 'react'

const Layout = ({ children }) => {
  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)'
      }}
      className={classes.layout__wrapper}
    >
      {children}
    </div>
  )
}

export default Layout
