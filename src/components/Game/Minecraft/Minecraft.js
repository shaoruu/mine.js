import React, { useEffect } from 'react'

import MainScene from './App/MainScene/MainScene'

const Minecraft = ({ id, username }) => {
  useEffect(() => {
    document.title = 'MinecraftJS - Game'
  })

  return <MainScene id={id} username={username} />
}

export default Minecraft
