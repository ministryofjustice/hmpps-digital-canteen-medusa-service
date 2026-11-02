import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'

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
                offenderNo: string
                cartId: string
            }
        }

        const { offenderNo, cartId } = metadata
        const cartService = req.scope.resolve(Modules.CART)

        // Fast path — cart_id from session
        if (cartId) {
            try {
                const cart = await cartService.retrieveCart(cartId)
                return res.json({ cart })
            } catch (e) {
                // Cart no longer valid, fall through to lookup
            }
        }

        // // Fallback — find open cart by prisoner
        // const [carts] = await cartService.listCarts({
        //     filters: {
        //         metadata: { offenderNo },
        //         status: "open"  // or however Medusa v2 filters active carts
        //     }
        // })
        //
        // if (carts.length > 0) {
        //     const cart = carts[0]
        //     return res.json({ cart })
        // }

        // No open cart exists
        return res.json({ cart: null })

    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve cart" })
    }
}
