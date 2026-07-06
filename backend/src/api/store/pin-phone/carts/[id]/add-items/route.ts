import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { Modules, ModuleRegistrationName } from "@medusajs/framework/utils"

type CartItemInput = {
    variant_id: string
    quantity: number
    unit_price?: number
    requires_shipping?: boolean
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params

    const { items } = req.body as {
        items: CartItemInput[]
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Cart is empty",
        })
    }

    const productModuleService = req.scope.resolve(
        ModuleRegistrationName.PRODUCT
    )

    // Validate all variants exist
    const validatedItems: CartItemInput[] = []
    for (const item of items) {
        const [variant] = await productModuleService.listProductVariants({
            id: item.variant_id,
        })

        if (!variant) {
            return res.status(404).json({
                message: `Variant not found: ${item.variant_id}`,
            })
        }

        validatedItems.push({
            variant_id: variant.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            requires_shipping: item.requires_shipping,
        })
    }

    // Add all items to cart in one workflow call
    await addToCartWorkflow(req.scope).run({
        input: {
            cart_id: id,
            items: validatedItems,
        },
    })

    // Retrieve updated cart
    const cartModuleService = req.scope.resolve(Modules.CART)
    const cart = await cartModuleService.retrieveCart(id, {
        relations: ["items"],
    })

    res.status(200).json({ cart })
}
