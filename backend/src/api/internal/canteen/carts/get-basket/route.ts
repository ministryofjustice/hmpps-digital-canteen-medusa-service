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

const isSubmitted = (cart?: { metadata?: Record<string, unknown> | null } | null) =>
  cart?.metadata?.cart_submitted === true

/**
 * @openapi
 * /internal/canteen/carts/get-basket:
 *   post:
 *     operationId: getMedusaBasket
 *     summary: Get the medusa basket and details, if it exists and any draft orders
 *     description: >
 *       Get the medusa basket and details, if it exists and any draft orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetBasketRequest'
 *     responses:
 *       200:
 *         description: Medusa basket and order successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetBasketResponse'
 *       500:
 *         description: Failed to create cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { data } = req.body as {
      data: {
        offenderNo: string
        cartId: string
      }
    }

    const { offenderNo, cartId } = data
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    let activeCart: CartQueryResult | undefined

    // get customer ID from prisoner number
    const { data: prisoners } = await query.graph({
      entity: 'prisoner',
      fields: ['id', 'prisoner_id', 'customer.*'],
      filters: {
        prisoner_id: offenderNo,
      },
    })
    const customerId = prisoners[0]?.customer?.id

    // Where cart ID is provided return it, providing cart has not been submitted already
    if (cartId) {
      const {
        data: [cart],
      } = await query.graph({
        entity: 'cart',
        fields: ['id', 'metadata', 'items.id', 'items.variant_id', 'items.title', 'items.quantity', 'items.unit_price'],
        filters: { id: cartId },
      })
      if (cart && !isSubmitted(cart)) {
        activeCart = cart as CartQueryResult
      }
    }

    // Where no cart ID provided (not in session), check fi any cart exists against the customer/prisoner
    if (!activeCart && customerId) {
      const { data: carts } = await query.graph({
        entity: 'cart',
        fields: ['id', 'metadata', 'items.id', 'items.variant_id', 'items.title', 'items.quantity', 'items.unit_price'],
        filters: { customer_id: customerId },
        pagination: {
          order: { created_at: 'DESC' },
        },
      })
      activeCart = carts.find(c => c.items?.length && !isSubmitted(c)) as CartQueryResult | undefined
    }

    // Find any existing draft order (a previously submitted cart)
    let draftOrderId: string | undefined
    if (customerId) {
      const { data: draftOrders } = await query.graph({
        entity: 'order',
        fields: ['id'],
        filters: {
          customer_id: customerId,
          is_draft_order: true,
          status: 'draft',
        },
        pagination: {
          order: { created_at: 'DESC' },
          take: 1,
        },
      })
      draftOrderId = draftOrders[0]?.id as string | undefined
    }

    // Where no cart is found
    if (!activeCart) {
      return res.json({ cartId: null, items: [], itemCount: 0, allItemsTotal: 0, draftOrderId })
    }

    // todo: mostly a placeholder for now, will be updated once data model is confirmed
    const items = (activeCart.items || []).map(item => ({
      lineItemId: item.id,
      variantId: item.variant_id,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.quantity * item.unit_price,
    }))

    return res.json({
      cartId: activeCart.id,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      allItemsTotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
      draftOrderId,
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
