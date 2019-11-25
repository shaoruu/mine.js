import sharedStyles from '../../../containers/sharedStyles.module.css'
import { CREATE_PLAYER_MUTATION } from '../../../lib/graphql'

import classes from './Multiplayer.module.css'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { withRouter, Redirect } from 'react-router-dom'
import { useMutation } from '@apollo/react-hooks'

const Multiplayer = ({ history, subpage }) => {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const input = useRef()

  useEffect(() => {
    if (!subpage) {
      document.title = 'mine.js - connect'
      input.current.focus()
    } else {
      document.title = 'mine.js - server'
    }
  })

  const onChange = useCallback(e => {
    setAddress(e.target.value)
    setError('')
  }, [])

  const [createPlayer] = useMutation(CREATE_PLAYER_MUTATION, {
    onError: e => {
      // eslint-disable-next-line no-console
      console.error(e.message)
      setError('World not found.')
      setAddress('')
    },
    onCompleted: () => history.push(`/game/minejs/${address}`)
  })

  if (!subpage)
    return (
      <div className={classes.wrapper}>
        <h1 className={classes.title}>Connect</h1>
        <div className={sharedStyles.inputField}>
          <p>World Address</p>
          <input value={address} type="text" onChange={onChange} ref={input} />
        </div>
        <p
          className={classes.error}
          style={{ display: error ? 'block' : 'none' }}
        >
          {error}
        </p>
        <div className={classes.buttonWrapper}>
          <button
            type="button"
            className={sharedStyles.button}
            disabled={!address}
            onClick={() => {
              createPlayer({
                variables: { worldId: address.trim(), gamemode: 'CREATIVE' }
              })
            }}
          >
            Join World
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
    )

  return <Redirect to="/game/multiplayer" />
}

export default withRouter(Multiplayer)
