import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { offender_no } = req.body as {
    offender_no: string
  }
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(id, { relations: ['items'] })

  if (!cart?.items?.length) {
    logger.error(`No cart items found`)
    return res.status(400).json({ message: 'No cart items found' })
  }
  const amount = cart?.items[0].unit_price

  const paymentCollection = await createPaymentCollectionForCartWorkflow(req.scope).run({ input: { cart_id: id } })

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

  const paymentSession = await paymentModuleService.createPaymentSession(paymentCollection.result.id, {
    provider_id: 'pp_bt-payment_bt-payment',
    amount,
    currency_code: 'gbp',
    data: { offender_no, amount },
  })

  try {
    const { result } = await completeCartWorkflow(req.scope).run({ input: { id } })
    return res.status(200).json({ order: result })
  } catch (err) {
    logger.error(`Cart completion failed for cart ${id}: ${(err as Error).message}`)

    // When error occurs, Backend API will populate error details, this can be retrieved from payment session
    const updatedSession = await paymentModuleService.retrievePaymentSession(paymentSession.id)
    const errorCode = updatedSession?.data?.error_code
    const errorMessage = updatedSession?.data?.error_message

    return res.status(400).json({
      message: errorMessage,
      code: errorCode,
    })
  }
}
