import { ExecArgs } from "@medusajs/framework/types"
import {ContainerRegistrationKeys, Modules} from "@medusajs/framework/utils"

export default async function ({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const salesChannelService = container.resolve(
        Modules.SALES_CHANNEL
    )

    const prisons = [
        {
            code: "EEI",
            name: "HMP Erlestoke",
        },
        {
            code: "ASI",
            name: "HMP Ashfield",
        },
        {
            code: "CKI",
            name: "HMP Cookham Wood",
        },
    ]

    const existingChannels =
        await salesChannelService.listSalesChannels()

    for (const prison of prisons) {
        const exists = existingChannels.find(
            (sc) => sc.name === prison.code
        )

        if (exists) {
            logger.info('Sales channel already exists')
            continue
        }

        await salesChannelService.createSalesChannels([
            {
                name: prison.code,
                description: prison.name,
            },
        ])

        logger.info('Sales channel created')
    }
}