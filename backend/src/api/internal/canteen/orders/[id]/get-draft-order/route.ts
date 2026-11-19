import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

// todo: not complete, just for testing support purposes currently
/**
 * @openapi
 * /internal/canteen/get-draft-order/{id}:
 *   get:
 *     operationId: getDraftOrder
 *     summary: Get a draft order and its items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: order_01M7AM87CYVP7V81VYQ1K1D7R1
 *     responses:
 *       200:
 *         description: Draft order successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetDraftOrderResponse'
 *       404:
 *         description: Draft order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to get draft order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const draftOrderId = req.params.id
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order],
    } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'subtotal',
        'total',
        'status',
        'items.title',
        'items.quantity',
        'items.unit_price',
        'items.subtotal',
        'items.total',
      ],
      filters: { id: draftOrderId, status: 'draft' },
    })

    if (!order) {
      return res.json({
        hasDraftOrder: false,
      })
    }

    const items = (order.items ?? []).filter(Boolean).map(item => ({
      title: item!.title,
      quantity: Number(item!.quantity),
      unitPrice: Number(item!.unit_price),
      lineTotal: Number(item!.total),
    }))

    return res.json({
      hasDraftOrder: true,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'GET_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to get draft order',
      developerMessage: `${(error as Error).message}`,
    })
  }
}
