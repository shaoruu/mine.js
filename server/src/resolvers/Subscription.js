const Subscription = {
	block: {
		subscribe(parent, { worldId }, { prisma }, info) {
			return prisma.subscription.block(
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
