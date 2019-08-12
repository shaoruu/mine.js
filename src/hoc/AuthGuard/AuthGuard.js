import { ME_QUERY } from '../../lib/graphql'
// import { signout } from '../../lib/utils'

import React from 'react'
import { useQuery } from '@apollo/react-hooks'

const withAuthGuard = WrappedComponent => () => {
  const { data, loading, error } = useQuery(ME_QUERY, {
    onError: err => {
      if (!err.message.includes('Authentication')) {
        console.error(err.message)
      }
    }
  })

  if (error) {
    return <WrappedComponent isAuth={false} />
  }

  if (!data || !data.me || loading) {
    return <WrappedComponent loading />
  }

  return <WrappedComponent isAuth username={data.me.username} />
}

export default withAuthGuard
