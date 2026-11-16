import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { PRISONER_MODULE } from '../../../../modules/prisoner-details'

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
 *         description: Successfully created Medusa user
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
      }
    }

    const { prisonId, offenderNo } = metadata
    const prisonerService = req.scope.resolve(PRISONER_MODULE)
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

    const [existingPrisoner] = await prisonerService.listPrisoners({
      prison_id: prisonId,
      prisoner_id: offenderNo,
    })

    if (existingPrisoner) {
      return res.sendStatus(200)
    }
    const customer = await customerService.createCustomers({
      metadata: {
        prisonId,
        offenderNo,
      },
      has_account: false,
    })
    const prisoner = await prisonerService.createPrisoners({
      prison_id: prisonId,
      prisoner_id: offenderNo,
    })
    await link.create({
      [Modules.CUSTOMER]: { customer_id: customer.id },
      [PRISONER_MODULE]: { prisoner_id: prisoner.id },
    })

    return res.sendStatus(200)
  } catch (error) {
    return res.status(500).json({
      status: 500,
      errorCode: 'CREATE_MEDUSA_USER_FAILED',
      userMessage: 'Failed to medusa user.',
      developerMessage: `create medusa user failed: ${(error as Error).message}`,
    })
  }
}
