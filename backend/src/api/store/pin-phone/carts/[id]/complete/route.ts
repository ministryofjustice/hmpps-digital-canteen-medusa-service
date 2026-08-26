import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export interface PaymentRequest {
  offender_no: string
  amountPence: number
  status: 'AUTHORIZED' | 'ERROR' | 'CANCELLED'
  transactionReference?: string
  holdNumber?: number
  errorCode?: string
  errorMessage?: string
  processedAt?: string
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
 *         $ref: '#/components/schemas/PaymentRequest'
 * responses:
 *   200:
 *     description: Cart completed or payment failure recorded
 *     content:
 *       application/json:
 *         schema:
 *           oneOf:
 *             - $ref: '#/components/schemas/CompleteCartOrderResponse'
 *   400:
 *     description: Invalid request — missing or invalid payload, or empty cart
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/ErrorResponse'
 *   404:
 *     description: Cart not found
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/ErrorResponse'
 *   500:
 *     description: Internal error during payment collection or session creation
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { PaymentRequest } = req.body as { PaymentRequest: PaymentRequest }
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(id, { relations: ['items'] })

  console.log("REQUEST", PaymentRequest)

  if (!cart?.items?.length) {
    logger.error(`No cart items found`)
    return res.status(400).json({
      status: 500,
      errorCode: 'CART_COMPLETION_FAILED',
      userMessage: 'No cart items found',
      developerMessage: `No items in cart for`,
    })
  }
  console.log("ONEEEEE")

  const amount = cart.items[0].unit_price


  let paymentCollectionId: string
  try {
    const paymentCollection = await createPaymentCollectionForCartWorkflow(req.scope).run({
      input: { cart_id: id },
    })
    paymentCollectionId = paymentCollection.result.id
  } catch (err) {
    logger.error(
        `Failed to create payment collection for cart ${id}: ${(err as Error).message}`
    )
    console.log("TWOOOO")
    return res.status(500).json({
      status: 500,
      errorCode: 'PAYMENT_COLLECTION_FAILED',
      userMessage: 'Unable to process payment at this time',
      developerMessage: `Payment collection creation failed for cart ${id}: ${(err as Error).message}`,
    })

  }

  console.log("THREEEE")

  try {
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

    await paymentModuleService.createPaymentSession(paymentCollectionId, {
      provider_id: 'pp_bt-payment_bt-payment',
      amount,
      currency_code: 'gbp',
      data: { ...PaymentRequest },
    })
  } catch (err) {
    logger.error(
        `Failed to create payment session for cart ${id}: ${(err as Error).message}`
    )
    console.log("FOUURRRR")
    return res.status(500).json({
      status: 500,
      errorCode: 'PAYMENT_SESSION_FAILED',
      userMessage: 'Unable to process payment at this time',
      developerMessage: `Payment session creation failed for cart ${id}: ${(err as Error).message}`,
    })
  }

  console.log("FIVEEEEE")

  try {
    const { result } = await completeCartWorkflow(req.scope).run({ input: { id } })
    return res.status(200).json({ order: result })
  } catch (err) {
    logger.error(`Cart completion failed for cart ${id}: ${(err as Error).message}`)

    return res.status(200).json({
      status: 500,
      errorCode: 'PAYMENT_AUTHORISATION_FAILED',
      userMessage: 'Payment was not authorised',
      developerMessage: `completeCartWorkflow failed for cart ${id}: ${(err as Error).message}`,
    })

  }
}
