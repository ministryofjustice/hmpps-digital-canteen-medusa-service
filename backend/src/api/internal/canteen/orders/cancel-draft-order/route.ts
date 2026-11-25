import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { cancelOrderWorkflow } from '@medusajs/core-flows'

/**
 * @openapi
 * /internal/canteen/orders/cancel-draft-order:
 *   post:
 *     operationId: cancelOrder
 *     summary: Cancel Medusa Order
 *     description: >
 *       Cancels an in draft medusa order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelDraftOrderRequest'
 *     responses:
 *       200:
 *         description: Draft order has successfully been canceled
 *       500:
 *         description: Failed to cancel draft order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { data } = req.body as {
      data: {
        draftOrderId: string
      }
    }
    const { draftOrderId } = data
    await cancelOrderWorkflow(req.scope).run({
      input: {
        order_id: draftOrderId,
      },
    })
    return res.json({ orderId: draftOrderId })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'CANCEL_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to cancel draft order cart',
      developerMessage: `${(error as Error).message}`,
    })
  }
}
