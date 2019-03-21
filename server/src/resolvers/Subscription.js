const Subscription = {
	chunk: {
		subscribe(parent, { worldId }, { prisma }, info) {
			return prisma.subscription.chunk(
				{
					where: {
						node: {
							world: {
								id: worldId
							}
						}
					}
				},
				info
			)
		}
	}
}

export default Subscription
