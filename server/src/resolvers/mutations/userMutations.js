import Helpers from '../../utils/helpers'
import { prisma } from '../../lib/server'

import bcrypt from 'bcryptjs'

const UserMutations = {
  async signup(parent, args) {
    const password = await Helpers.hashPassword(args.data.password)

    const user = await prisma.user.create({
      data: {
        ...args.data,
        password,
        settings: {
          create: {
            renderDistance: 2
          }
        }
      }
    })

    return {
      user,
      token: Helpers.generateToken(user.id)
    }
  },
  async login(parent, args) {
    const user = await prisma.user.findUnique({
      where: { email: args.data.email }
    })

    if (!user) {
      throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(args.data.password, user.password)

    if (!isMatch) {
      throw new Error('Unable to login')
    }

    return {
      user,
      token: Helpers.generateToken(user.id)
    }
  },
  async deleteUser(parent, args, { user }) {
    return prisma.user.delete({
      where: user
    })
  },
  async updateUser(parent, args, { user }) {
    return prisma.user.update({
      where: user,
      data: args.data
    })
  },
  updateSettings(
    parent,
    {
      data: { id, ...data },
      where
    }
  ) {
    if (!where && id) {
      where = {
        id
      }
    }

    return prisma.settings.update({
      where,
      data
    })
  }
}

export default UserMutations
