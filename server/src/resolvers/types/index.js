
export default {
  AuthPayload: {
    user: (parent, args, { prisma }, info) => {
      const {
        user,
      } = parent || {};

      return user ? prisma.query.user({
        where: {
          id: user.id,
        },
      }, info) : null;
    }
  },
}