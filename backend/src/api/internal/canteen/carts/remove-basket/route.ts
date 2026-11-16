import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

/**
 * @openapi
 * /internal/canteen/carts/remove-basket:
 *   post:
 *     operationId: removeBasket
 *     summary: Remove Medusa Basket
 *     description: >
 *       Remove Medusa Basket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveBasketRequest'
 *     responses:
 *       200:
 *         description: Items successfully removed from cart
 *       500:
 *         description: Failed to remove cart
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
      }
    }
    const { cartId } = metadata
    const cartModule = req.scope.resolve(Modules.CART)

    await cartModule.deleteCarts(cartId)
    return res.sendStatus(200)
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'REMOVE_CART_FAILED',
      userMessage: 'Failed to remove cart',
      developerMessage: `${(error as Error).message}`,
    })
  }
}
