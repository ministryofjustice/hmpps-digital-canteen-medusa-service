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
        prison_id: string
        offender_no: string
      }
    }

  const { prison_id, offender_no } = metadata
  const prisonerService = req.scope.resolve(PRISONER_MODULE)
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const [existingPrisoner] = await prisonerService.listPrisoners({
    prison_id,
    prisoner_id: offender_no,
  })

  if (existingPrisoner) {
    console.log('Prisoner already exists')
    return res.sendStatus(200)
  } else {
    console.log('Prisoner does not exist, creating')
    const customer = await customerService.createCustomers({
      metadata: {
        prison_id,
        offender_no,
      },
      has_account: false,
    })
    const prisoner = await prisonerService.createPrisoners({
      prison_id,
      prisoner_id: offender_no,
    })
    await link.create({
      [Modules.CUSTOMER]: { customer_id: customer.id },
      [PRISONER_MODULE]: { prisoner_id: prisoner.id },
    })
  }

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
