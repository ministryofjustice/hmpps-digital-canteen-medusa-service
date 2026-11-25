import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, OrderStatus } from '@medusajs/framework/utils'
import {
  createOrderWorkflow,
  beginDraftOrderEditWorkflow,
  addDraftOrderItemsWorkflow,
  confirmDraftOrderEditWorkflow,
  cancelDraftOrderEditWorkflow,
  updateCartWorkflow,
  updateDraftOrderItemWorkflow,
} from '@medusajs/medusa/core-flows'
import type { CreateOrderWorkflowInput } from '@medusajs/medusa/core-flows'

const errorResponse = (
  res: MedusaResponse,
  status: number,
  errorCode: string,
  userMessage: string,
  developerMessage: string,
) => res.status(status).json({ status, errorCode, userMessage, developerMessage })

/**
 * @openapi
 * /internal/canteen/orders/[id]/create-draft-order:
 *   post:
 *     operationId: createDraftOrder
 *     summary: Creates a draft order within medusa
 *     description: >
 *       Creates draft order, If no draftOrderId in request, we create a new draft oder and add the carts items into it,
 *       If a draftOrder is provided, we take the items from the cart, and add those items into existing draft order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDraftOrderRequest'
 *     responses:
 *       200:
 *         description: Medusa draft order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateDraftOrderResponse'
 *       500:
 *         description: Failed to create draft order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const cartId = req.params.id
    const { data } = req.body as {
      data: {
        draftOrderId: string
      }
    }
    const { draftOrderId } = data
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // get the cart details from cartId
    const {
      data: [cart],
    } = await query.graph({
      entity: 'cart',
      fields: [
        'id',
        'customer_id',
        'region_id',
        'currency_code',
        'email',
        'sales_channel_id',
        'metadata',
        'items.id',
        'items.variant_id',
        'items.title',
        'items.quantity',
        'items.unit_price',
      ],
      filters: { id: cartId },
    })

    if (!cart) {
      return errorResponse(res, 404, 'CART_NOT_FOUND', 'Cart not found', `Cart ${cartId} not found`)
    }

    if (cart.metadata?.cart_submitted === true) {
      return errorResponse(
        res,
        400,
        'CART_ALREADY_SUBMITTED',
        'This cart has already been submitted',
        `Cart ${cartId} has already been submitted to a draft order`,
      )
    }

    if (!cart.items?.length) {
      return errorResponse(
        res,
        400,
        'CART_EMPTY',
        'Cart has no items',
        `Cart ${cartId} has no items to add to draft order`,
      )
    }

    // retrieve items from provided cart, and extract data required for adding to draft order
    const items = cart.items
      .filter(item => item?.variant_id)
      .map(item => ({
        variant_id: item!.variant_id as string,
        quantity: Number(item!.quantity),
        title: item!.title,
        unit_price: Number(item!.unit_price),
      }))

    // Begins an update of an existing Draft order, adding new items, or updating existing item quantities
    let resultOrderId: string
    if (draftOrderId) {
      const actorId = cart.customer_id ?? 'canteen-api'
      const {
        data: [draftOrder],
      } = await query.graph({
        entity: 'order',
        fields: ['id', 'status', 'is_draft_order', 'currency_code', 'items.id', 'items.variant_id', 'items.quantity'],
        filters: { id: draftOrderId },
      })

      if (!draftOrder?.is_draft_order) {
        return errorResponse(
          res,
          404,
          'DRAFT_ORDER_NOT_FOUND',
          'Draft order not found',
          `Draft order ${draftOrderId} not found or is no longer a draft`,
        )
      }

      // Get existing items already in draft order
      const existingOrderItems = new Map<string, { id: string; quantity: number }>()
      for (const line of draftOrder.items ?? []) {
        if (line?.variant_id && !existingOrderItems.has(line.variant_id)) {
          existingOrderItems.set(line.variant_id, { id: line.id, quantity: Number(line.quantity) })
        }
      }

      // Get the items from the provided cart ID
      const cartItems = new Map<string, (typeof items)[number]>()
      for (const item of items) {
        const existing = cartItems.get(item.variant_id)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          cartItems.set(item.variant_id, { ...item })
        }
      }

      const itemsToUpdate: { id: string; quantity: number }[] = []
      const itemsToAdd: typeof items = []

      // for each item in cart, check if variant exists in draft order already
      // >> items to update, if variant already exists in draft order (essentially changes quantity)
      // >> item to add, if variant not in draft order
      for (const [variantId, item] of cartItems) {
        const existingLine = existingOrderItems.get(variantId)
        if (existingLine) {
          itemsToUpdate.push({ id: existingLine.id, quantity: existingLine.quantity + item.quantity })
        } else {
          itemsToAdd.push(item)
        }
      }

      // starts the existing draft order update process
      await beginDraftOrderEditWorkflow(req.scope).run({
        input: { order_id: draftOrderId, created_by: actorId },
      })

      try {
        if (itemsToUpdate.length) {
          await updateDraftOrderItemWorkflow(req.scope).run({
            input: { order_id: draftOrderId, items: itemsToUpdate },
          })
        }

        if (itemsToAdd.length) {
          await addDraftOrderItemsWorkflow(req.scope).run({
            input: { order_id: draftOrderId, items: itemsToAdd },
          })
        }

        await confirmDraftOrderEditWorkflow(req.scope).run({
          input: { order_id: draftOrderId, confirmed_by: actorId },
        })
      } catch (editError) {
        // if updating the existing draft order update process fails, cancel any edit
        await cancelDraftOrderEditWorkflow(req.scope).run({ input: { order_id: draftOrderId } })
        return res.status(500).json({
          status: 500,
          errorCode: 'CREATE_DRAFT_ORDER_FAILED',
          userMessage: 'Failed to create a draft order',
          developerMessage: `${(editError as Error).message}`,
        })
      }

      resultOrderId = draftOrderId

      await updateCartWorkflow(req.scope).run({
        input: {
          id: cart.id,
          metadata: {
            ...(cart.metadata ?? {}),
            cart_submitted: true,
            draft_order_id: resultOrderId,
          },
        },
      })
      return res.json({ draftOrderId: resultOrderId })
    }
    // Where no existing Draft order, create draft order and add cart items into it
    const input = {
      status: OrderStatus.DRAFT,
      is_draft_order: true,
      region_id: cart.region_id,
      currency_code: cart.currency_code,
      email: cart.email,
      customer_id: cart.customer_id,
      sales_channel_id: cart.sales_channel_id,
      items,
      metadata: { source_cart_id: cart.id },
    } as CreateOrderWorkflowInput

    const { result: order } = await createOrderWorkflow(req.scope).run({ input })
    resultOrderId = order.id

    await updateCartWorkflow(req.scope).run({
      input: {
        id: cart.id,
        metadata: {
          ...(cart.metadata ?? {}),
          cart_submitted: true,
          draft_order_id: resultOrderId,
        },
      },
    })
    return res.json({ draftOrderId: resultOrderId })
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'CREATE_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to create a draft order',
      developerMessage: `${(error as Error).message}`,
    })
  }
}
