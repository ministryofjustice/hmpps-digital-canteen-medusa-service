import { MedusaContainer } from '@medusajs/framework/types'
import { ScheduledJobContext } from '@medusajs/framework'
import {
    ContainerRegistrationKeys,
    Modules,
} from '@medusajs/framework/utils'

export default async function cleanupOrphanCarts(
    container: MedusaContainer,
    context: ScheduledJobContext
) {
    const logger = container.resolve(
        ContainerRegistrationKeys.LOGGER
    )
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const cartModuleService = container.resolve(Modules.CART)

    logger.info(`Running cleanupOrphanCarts job`)

    // Calculated 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() -  15 * 60 * 1000)

    try {
        // fetch carts with created at older than 24 hours and completed_at and deleted_at are null
        const { data: carts } = await query.graph({
            entity: Modules.CART,
            fields: ['id',
                'completed_at',
                'deleted_at',
                'created_at',
                'order.id',
            ],
            filters: {
                completed_at: null,
                deleted_at: null,
                created_at: {
                    $lt: twentyFourHoursAgo,
                }
            },
        })

        // fetch carts that are not associated with an order
        if (carts.length > 0) {
            const cartIds = carts.filter((cart) => !cart.order).map((cart) => cart.id)
            logger.info(`Deleting ${cartIds.length} orphan carts: ${cartIds.join(", ")}`)
            await cartModuleService.deleteCarts(cartIds)
        } else {
            logger.info("No orphan carts found to delete.")
        }
    } catch (error) {
        logger.error(`Error in cleanupOrphanCarts job: ${error.message}`, error)
    }
}

export const config = {
    name: 'cleanup-orphan-carts',
    schedule: '*/15 * * * *' // every day at 3am
}