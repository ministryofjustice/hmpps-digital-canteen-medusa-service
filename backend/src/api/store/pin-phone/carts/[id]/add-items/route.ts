import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { addToCartWorkflow } from '@medusajs/medusa/core-flows'
import { Modules, ModuleRegistrationName } from '@medusajs/framework/utils'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id: cartId } = req.params
    const { amount } = req.body as { amount: number }

    const productModule = req.scope.resolve(ModuleRegistrationName.PRODUCT)
    const cartModule = req.scope.resolve(Modules.CART)

    // Fetch the PIN-PHONE-CREDIT variant
    const [pinPhoneVariant] = await productModule.listProductVariants({
      sku: 'PIN-PHONE-CREDIT',
    })

    if (!pinPhoneVariant) {
      return res.status(404).json({
        message: 'PIN Phone variant not found. Please check the SKU and try again.',
      })
    }

    // Add item to cart
    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: [
          {
            variant_id: pinPhoneVariant.id,
            quantity: 1,
            unit_price: amount,
            requires_shipping: false,
          },
        ],
      },
    })

    // Retrieve updated cart
    const cart = await cartModule.retrieveCart(cartId, {
      relations: ['items'],
    })
    return res.status(200).json({ cart })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add pin phone to cart',
      error: error instanceof Error ? error.message : error,
    })
  }
}
