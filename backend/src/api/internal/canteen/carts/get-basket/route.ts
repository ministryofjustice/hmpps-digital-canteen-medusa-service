import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

interface CartQueryResult {
  id: string
  items?: {
    id: string
    variant_id: string
    title: string
    quantity: number
    unit_price: number
  }[]
}

/**
 * @openapi
 * /internal/canteen/carts/get-basket:
 *   post:
 *     operationId: getMedusaBasket
 *     summary: Get the medusa basket and details, if it exists
 *     description: >
 *       Get the medusa basket and details, if it exists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetBasketRequest'
 *     responses:
 *       200:
 *         description: Medusa basket successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetBasketRequest'
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
        offenderNo: string
        cartId: string
      }
    }

    const { offenderNo, cartId } = metadata
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    let activeCart: CartQueryResult | undefined

    // Where cartId was passed from user session
    if (cartId) {
      const {
        data: [cart],
      } = await query.graph({
        entity: 'cart',
        fields: ['id', 'items.id', 'items.variant_id', 'items.title', 'items.quantity', 'items.unit_price'],
        filters: {
          id: cartId,
        },
      })
      activeCart = cart as CartQueryResult
    }

    // Where cartId was not passed from user session, verify if cart exists within medusa
    if (!activeCart) {
      const { data: prisoners } = await query.graph({
        entity: 'prisoner',
        fields: ['id', 'prisoner_id', 'customer.*'],
        filters: {
          prisoner_id: offenderNo,
        },
      })
      const customerId = prisoners[0]?.customer?.id

      const { data: carts } = await query.graph({
        entity: 'cart',
        fields: ['id', 'items.id', 'items.variant_id', 'items.title', 'items.quantity', 'items.unit_price'],
        filters: {
          customer_id: customerId,
        },
        pagination: {
          order: {
            created_at: 'DESC',
          },
        },
      })
      activeCart = carts.find(c => c.items?.length > 0) as CartQueryResult | undefined
    }

    // Where no cart exists
    if (!activeCart) {
      return res.json({ cartId: null, items: [], itemCount: 0, total: 0 })
    }

    const items = (activeCart.items || []).map(item => ({
      lineItemId: item.id,
      variantId: item.variant_id,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.quantity * item.unit_price,
    }))

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const allItemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

    return res.json({
      cartId: activeCart.id,
      items,
      itemCount,
      allItemsTotal,
    })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'GET_CART_FAILED',
      userMessage: 'Failed to get medusa cart',
      developerMessage: `${(error as Error).message}`,
    })
  }
}
