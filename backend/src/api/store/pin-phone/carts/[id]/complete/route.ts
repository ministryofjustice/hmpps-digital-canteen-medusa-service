import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export interface PaymentResult {
  offender_no: string
  status: 'AUTHORISED' | 'ERROR' | 'CANCELLED'
  transactionBatchNumber?: string
  transactionReference?: string
  holdNumber?: number
  errorCode?: string
  errorMessage?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { PaymentResult } = req.body as { PaymentResult: PaymentResult }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(id, { relations: ['items'] })

  if (!cart?.items?.length) {
    logger.error(`No cart items found`)
    return res.status(400).json({ message: 'No cart items found' })
  }

  const amount = cart.items[0].unit_price

  const paymentCollection = await createPaymentCollectionForCartWorkflow(req.scope).run({
    input: { cart_id: id },
  })

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

  await paymentModuleService.createPaymentSession(paymentCollection.result.id, {
    provider_id: 'pp_bt-payment_bt-payment',
    amount,
    currency_code: 'gbp',
    data: { ...PaymentResult },
  })

  try {
    const { result } = await completeCartWorkflow(req.scope).run({ input: { id } })
    return res.status(200).json({ order: result })
  } catch (err) {
    logger.error(`Cart completion failed for cart ${id}: ${(err as Error).message}`)

    return res.status(200).json({
      message: PaymentResult.errorMessage ?? 'Payment was not authorised',
      code: PaymentResult.errorCode ?? PaymentResult.status,
    })
  }
}
