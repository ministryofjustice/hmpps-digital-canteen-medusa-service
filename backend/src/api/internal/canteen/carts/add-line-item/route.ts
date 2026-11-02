import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {addToCartWorkflow, createCartWorkflow} from "@medusajs/medusa/core-flows";

/**
 * @openapi
 * /internal/canteen/carts/add-line-item:
 *   post:
 *     operationId: addLineItem
 *     summary: Add item to existing cart, or create new cart and add item
 *     description: >
 *       Where a medusa cart already exists, add the product variant to the cart.
 *       If no cart exists, create a new cart and add the product variant.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddLineItemsRequest'
 *     responses:
 *       200:
 *         description: Items successfully added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AddLineItemsResponse'
 *       500:
 *         description: Failed to add line items to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    try {
        const { metadata } = req.body as {
            metadata: {
                prisonId: string
                offenderNo: string
                cartId: string
                productVariantId: string
            }
        }

        const { prisonId, offenderNo, cartId, productVariantId } = metadata
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        if (!offenderNo) {
            return res.status(404).json({
                status: 404,
                userMessage: 'Prisoner not found'
            })
        }

        // Get the customerId linked to offenderNo
        console.log('Following link to get customer ID')

        const { data: prisoners } = await query.graph({
            entity: "prisoner",
            fields: ["id", "prisoner_id", "customer.*"],
            filters: {
                prisoner_id: offenderNo,
            },
        })

        const customerId = prisoners[0]?.customer?.id
        console.log('Customer ID:', customerId)

        // Where cart already exists (from user session), pass cartId and variantId to add to cart
        if (cartId) {
            await addToCartWorkflow(req.scope).run({
                input: {
                    cart_id: cartId,
                    items: [
                        {
                            variant_id: productVariantId,
                            quantity: 1,
                            requires_shipping: false,
                        },
                    ],
                },
            })
            return res.json({ cartId: cartId })
        }

        // Where no cat already exists, create new cart against prisonId using prisons region and sales channel

        // find region associated with prisonId
        const regionService = req.scope.resolve(Modules.REGION)
        const [region] = await regionService.listRegions({
            metadata: { prison_code: prisonId },
        })
        const regionId = region?.id

        // find sales channel associated with prisonId
        const { data: salesChannels } = await query.graph({
            entity: "sales_channel",
            fields: ["id", "name"],
            filters: {
                name: prisonId,
            },
        })
        const salesChannelId = salesChannels[0]?.id

        const { result: cart } = await createCartWorkflow(req.scope).run({
            input: {
                region_id: regionId,
                sales_channel_id: salesChannelId,
                customer_id: customerId,
                metadata: { order_type: 'CANTEEN' },
            },
        })

        await addToCartWorkflow(req.scope).run({
            input: {
                cart_id: cart.id,
                items: [
                    {
                        variant_id: productVariantId,
                        quantity: 1,
                        requires_shipping: false,
                    },
                ],
            },
        })
        return res.json({ cartId: cart.id })


    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 500,
            errorCode: 'ADD_TO_CART_FAILED',
            userMessage: 'Failed to add item to cart',
            developerMessage: `${(error as Error).message}`,
        })
    }
}