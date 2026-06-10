import { container, MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(id, { relations: ['items'] })

  if (!cart?.items?.length) {
    logger.warn(`No cart items found`)
    return
  }
  const amount = cart?.items[0].unit_price

  const paymentCollection = await createPaymentCollectionForCartWorkflow(req.scope).run({ input: { cart_id: id } })

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
  await paymentModuleService.createPaymentSession(paymentCollection.result.id, {
    provider_id: 'pp_bt-payment_bt-payment',
    amount,
    currency_code: 'gbp',
    data: {},
  })

  const { result } = await completeCartWorkflow(req.scope).run({ input: { id } })

  res.status(200).json({ order: result })
}
