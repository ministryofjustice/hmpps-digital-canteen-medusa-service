import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {addToCartWorkflow, createCartWorkflow} from "@medusajs/medusa/core-flows";
import {PRISONER_MODULE} from "../../../../../modules/prisoner-details";

/**
 * @openapi
 * /internal/canteen/create-user:
 *   post:
 *     operationId: createMedusaUser
 *     summary: Create a Medusa User
 *     description: >
 *       Creates a Medusa user for a prisoner. Linking prisoner to customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMedusaUserRequest'
 *     responses:
 *       200:
 *         description: Failed to create Medusa user
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
                prisonId: string
                offenderNo: string
                cartId: string
                productVariantId: string
            }
        }

        console.log('Adding to cartttttt')

        const { prisonId, offenderNo, cartId, productVariantId } = metadata
        const cartModuleService = req.scope.resolve(Modules.CART)
        const prisonerService = req.scope.resolve(PRISONER_MODULE)
        const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

        // Find the prisoner
        console.log('Finding prisoner')
        const [prisoner] = await prisonerService.listPrisoners({
            prisoner_id: offenderNo,
        })

        if (!prisoner) {
            console.log('Prisoner not found')
            return res.status(404).json({
                status: 404,
                userMessage: 'Prisoner not found'
            })
        }

        // Follow the link to get the customer ID
        console.log('Following link to get customer ID')
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

        const { data: prisoners } = await query.graph({
            entity: "prisoner",
            fields: ["id", "prisoner_id", "customer.*"],
            filters: {
                prisoner_id: offenderNo,
            },
        })

        const customerId = prisoners[0]?.customer?.id
        console.log('Customer ID:', customerId)



        // Where cart already exists, pass cartId and variantId to add to cart
        if (cartId) {
            console.log('Adding to existing cart')
            try {
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
            } catch (e) {
                // unsure, to update
            }
        } else {

            console.log('Creating new cart, then adding to cart')
            // Where no cartId — create a new cart then add variantId to cart
            await createCartWorkflow(req.scope).run({
                input: {
                    region_id: "reg_01M612TSH8XJS651767EEW18J1",
                    sales_channel_id: "sc_01M612TSHWX9EP42ZZRD5EDBW4",
                    customer_id: customerId,
                    metadata: { order_type: 'PIN_PHONE' },
                },
            })

            try {
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
            } catch (e) {
                // unsure, to update
            }

        }




        // No open cart exists
        return res.json({ cart: null })

    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve cart" })
    }
}
