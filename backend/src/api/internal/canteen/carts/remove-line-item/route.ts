import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {deleteLineItemsWorkflow, updateLineItemInCartWorkflow} from "@medusajs/medusa/core-flows"

/**
 * @openapi
 * /internal/canteen/carts/remove-line-item:
 *   post:
 *     operationId: removeLineItem
 *     summary: Remove line Item
 *     description: >
 *       Removes a line item from the medusa cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveLineItemsRequest'
 *     responses:
 *       200:
 *         description: Items successfully removed from cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RemoveLineItemsResponse'
 *       500:
 *         description: Failed to create cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        const { metadata } = req.body as {
            metadata: {
                cartId: string
                lineItemId: string
                quantity: number
            }
        }
        const { cartId, lineItemId, quantity } = metadata

        if (quantity <= 0) {
            await deleteLineItemsWorkflow(req.scope).run({
                input: {
                    cart_id: cartId,
                    ids: [lineItemId],
                },
            })
        } else {
            await updateLineItemInCartWorkflow(req.scope).run({
                input: {
                    cart_id: cartId,
                    item_id: lineItemId,
                    update: {
                        quantity: quantity,
                    },
                },
            })
        }

        return res.json({ cartId })

    } catch (error) {
        return res.status(500).json({
            status: 500,
            errorCode: 'REMOVE_LINE_ITEM_FAILED',
            userMessage: 'Failed to remove item from cart',
            developerMessage: `${(error as Error).message}`,
        })
    }
}