import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export interface PaymentResult {
  offender_no: string
  status: 'AUTHORIZED' | 'ERROR' | 'CANCELLED'
  transactionReference?: string
  holdNumber?: number
  errorCode?: string
  errorMessage?: string
}

/**
 * @oas [post] /store/pin-phone/carts/{id}/complete
 * operationId: completePinPhoneCart
 * summary: Complete a PIN phone cart
 * description: Completes a PIN phone cart by creating a payment collection, payment session
 *   with the BT payment result, and running the cart completion workflow.
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     schema:
 *       type: string
 *     description: The cart ID
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - PaymentResult
 *         properties:
 *           PaymentResult:
 *             type: object
 *             required:
 *               - offender_no
 *               - status
 *             properties:
 *               offender_no:
 *                 type: string
 *                 description: The prisoner's offender number
 *                 example: "A1234BC"
 *               status:
 *                 type: string
 *                 enum:
 *                   - AUTHORIZED
 *                   - ERROR
 *                   - CANCELLED
 *                 description: Payment authorisation status
 *               transactionReference:
 *                 type: string
 *                 description: Reference from the payment provider
 *               holdNumber:
 *                 type: integer
 *                 description: The finance hold number
 *               errorCode:
 *                 type: string
 *                 description: Error code if payment failed
 *               errorMessage:
 *                 type: string
 *                 description: Error message if payment failed
 * responses:
 *   200:
 *     description: Cart completed or payment failure details returned
 *     content:
 *       application/json:
 *         schema:
 *           oneOf:
 *             - type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *             - type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *   400:
 *     description: No cart items found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */
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
