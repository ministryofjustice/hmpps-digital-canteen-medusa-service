import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { createCartWorkflow } from '@medusajs/medusa/core-flows'
import { Modules, ContainerRegistrationKeys, ModuleRegistrationName } from '@medusajs/framework/utils'
import { PRISONER_MODULE } from '../../../../modules/prisoner-details'

/**
 * @oas [post] /store/pin-phone/carts
 * operationId: createPinPhoneCart
 * summary: Create a PIN phone cart
 * description: Creates a new cart for a prisoner's PIN phone purchase. If the prisoner
 *   has used the service before, the cart is linked to their existing customer record.
 *   Otherwise, a new customer and prisoner record are created and linked.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - metadata
 *         properties:
 *           metadata:
 *             type: object
 *             required:
 *               - prison_id
 *               - offender_no
 *               - first_name
 *               - second_name
 *             properties:
 *               prison_id:
 *                 type: string
 *                 description: The prison identifier
 *                 example: "MDI"
 *               offender_no:
 *                 type: string
 *                 description: The prisoner's offender number
 *                 example: "A1234BC"
 *               first_name:
 *                 type: string
 *                 description: Prisoner's first name
 *                 example: "John"
 *               second_name:
 *                 type: string
 *                 description: Prisoner's last name
 *                 example: "Smith"
 * responses:
 *   200:
 *     description: Cart created successfully
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             cart:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The cart ID
 *   500:
 *     description: Internal server error
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { metadata } = req.body as {
    metadata: {
      prison_id: string
      offender_no: string
      first_name: string
      second_name: string
    }
  }

  const { prison_id, offender_no, first_name, second_name } = metadata
  const prisonerService = req.scope.resolve(PRISONER_MODULE)
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const regionModuleService = req.scope.resolve(ModuleRegistrationName.REGION)

  const [existingPrisoner] = await prisonerService.listPrisoners({
    prison_id,
    prisoner_id: offender_no,
  })

  // medusa has customer table inbuilt, it does not have a customizable schema, instead of storing offender_no
  // in meta_data, we can create a separate prisoner module and table and link them to make later queries like
  // order history easier
  //
  // Check if prisoner has used service before i.e. already exists, if they do create cart against that
  let customerId: string | undefined
  if (existingPrisoner) {
    const {
      data: [linked],
    } = await query.graph({
      entity: 'prisoner',
      fields: ['customer.*'],
      filters: { id: existingPrisoner.id },
    })
    customerId = linked?.customer?.id
  } else {
    // create new customer.
    const customer = await customerService.createCustomers({
      first_name,
      last_name: second_name,
      metadata: {
        prison_id,
        offender_no,
      },
      has_account: false,
    })
    // create new prisoner.
    const prisoner = await prisonerService.createPrisoners({
      prison_id,
      prisoner_id: offender_no,
      prisoner_first_name: first_name,
      prisoner_second_name: second_name,
    })
    // form link between them.
    await link.create({
      [Modules.CUSTOMER]: { customer_id: customer.id },
      [PRISONER_MODULE]: { prisoner_id: prisoner.id },
    })
    customerId = customer.id
  }

  // Create cart using Pin Phone Credit region
  const [region] = await regionModuleService.listRegions({ name: 'Pin Phone Credit - United Kingdom' })

  const { result } = await createCartWorkflow(req.scope).run({
    input: {
      region_id: region.id,
      customer_id: customerId,
    },
  })

  res.status(200).json({ cart: result })
}
