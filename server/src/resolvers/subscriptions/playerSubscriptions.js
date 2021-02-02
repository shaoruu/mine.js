const PlayerSubscriptions = {
  player: {
    async subscribe(parent, { playerId }, { prisma, pubsub }) {
      const player = await prisma.player.findUnique({
        where: { id: Number(playerId) }
      })

      if (!player) {
        throw new Error('Player not found')
      }

      return pubsub.asyncIterator(`player ${playerId}`)
    }
  }
}

export default PlayerSubscriptions
