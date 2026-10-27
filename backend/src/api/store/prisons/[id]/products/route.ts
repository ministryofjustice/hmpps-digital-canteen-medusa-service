import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"

import {
    ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const query = req.scope.resolve(
        ContainerRegistrationKeys.QUERY
    )

    const prisonId = req.params.id

    const { data: products } = await query.graph({
        entity: "product",
        fields: [
            "id",
            "title",
            "handle",
            "metadata",
            "sales_channels.id",
            "sales_channels.name",
        ],
    })

    const prisonProducts = products.filter(
        (product) =>
            product.sales_channels?.some(
                (sc) => sc?.name === prisonId
            ) ?? false
    )

    return res.status(200).json({
        prison: prisonId,
        count: prisonProducts.length,
        products: prisonProducts.map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            ic_code: p.metadata?.ic_code,
        })),
    })
}