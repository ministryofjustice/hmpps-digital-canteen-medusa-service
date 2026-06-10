import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { addToCartWorkflow } from '@medusajs/medusa/core-flows'
import { ModuleRegistrationName, Modules } from '@medusajs/framework/utils'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { amount } = req.body as {
    amount: number
  }

  const productModuleService = req.scope.resolve(ModuleRegistrationName.PRODUCT)
  const [variant] = await productModuleService.listProductVariants({ sku: 'PIN-CREDIT' })

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: id,
      items: [
        {
          variant_id: variant.id,
          quantity: 1,
          unit_price: amount,
          requires_shipping: false,
        },
      ],
    },
  })

  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(id, { relations: ['items'] })

  res.status(200).json({ cart })
}
