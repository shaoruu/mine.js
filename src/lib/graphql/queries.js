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
      worlds {
        lastPlayed
        id
        name
        seed
      }
    }
  }
`

export const MINI_WORLD_QUERY = gql`
  query World($where: WorldWhereUniqueInput!) {
    world(where: $where) {
      id
      name
    }
  }
`

export const WORLD_QUERY = gql`
  query World($query: ID!) {
    world(where: { id: $query }) {
      id
      name
      seed
      type
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
          settings {
            id
            renderDistance
          }
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
        health
        armor
        hunger
      }
    }
  }
`

export const MY_SETTINGS = gql`
  query Me {
    me {
      settings {
        id
        renderDistance
      }
    }
  }
`
