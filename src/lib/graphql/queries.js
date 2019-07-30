import gql from 'graphql-tag'

export const ME_QUERY = gql`
  query Me {
    me {
      username
    }
  }
`

export const USERS_QUERY = gql`
  query Users {
    users {
      username
    }
  }
`

export const MY_WORLDS_QUERY = gql`
  query MyWorlds {
    myWorlds {
      lastPlayed
      id
      name
      seed
    }
  }
`

export const MINI_WORLD_QUERY = gql`
  query World($query: String!) {
    world(query: $query) {
      id
      name
    }
  }
`

export const WORLD_QUERY = gql`
  query World($query: String!) {
    world(query: $query) {
      id
      name
      seed
      time
      days
      changedBlocks {
        type
        x
        y
        z
      }
      players {
        id
        isAdmin
        gamemode
        user {
          username
        }
        lastLogin
        x
        y
        z
        dirx
        diry
        inventory {
          cursor
          data
        }
      }
    }
  }
`
