import { ExecArgs } from "@medusajs/framework/types"
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils"

export default async function ({
                                   container,
                               }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const query = container.resolve(
        ContainerRegistrationKeys.QUERY
    )

    const link = container.resolve(
        ContainerRegistrationKeys.LINK
    )

    const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "metadata"],
    })

    const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
    })

    const coffee = products.find(
        (p) => p.metadata?.ic_code === "182801"
    )

    const biscuits = products.find(
        (p) => p.metadata?.ic_code === "182802"
    )

    const stamp = products.find(
        (p) => p.metadata?.ic_code === "182803"
    )

    const prison_eei = salesChannels.find(
        (s) => s.name === "EEI"
    )

    const prison_asi = salesChannels.find(
        (s) => s.name === "ASI"
    )

    if (!coffee || !biscuits || !stamp) {
        throw new Error("Products not found")
    }

    if (!prison_asi || !prison_eei) {
        throw new Error("Sales channels not found")
    }

    await link.create([
        {
            [Modules.PRODUCT]: {
                product_id: coffee.id,
            },
            [Modules.SALES_CHANNEL]: {
                sales_channel_id: prison_eei.id,
            },
        },
        {
            [Modules.PRODUCT]: {
                product_id: coffee.id,
            },
            [Modules.SALES_CHANNEL]: {
                sales_channel_id: prison_asi.id,
            },
        },
        {
            [Modules.PRODUCT]: {
                product_id: stamp.id,
            },
            [Modules.SALES_CHANNEL]: {
                sales_channel_id: prison_eei.id,
            },
        },
        {
            [Modules.PRODUCT]: {
                product_id: biscuits.id,
            },
            [Modules.SALES_CHANNEL]: {
                sales_channel_id: prison_asi.id,
            },
        },
    ])

    logger.info('Prison catalogues seeded')
}