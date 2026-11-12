import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { POST } from '../route'
import { PRISONER_MODULE } from '../../../../../modules/prisoner-details'

// Mock workflow
jest.mock('@medusajs/medusa/core-flows', () => ({
  createCartWorkflow: jest.fn(),
}))

describe('POST /internal/canteen/create-user', () => {
  let req: any
  let res: any
  let container: any
  let prisonerService: any
  let customerService: any
  let linkService: any

  beforeEach(() => {
    // Mock services
    prisonerService = {
      listPrisoners: jest.fn(),
      createPrisoners: jest.fn(),
    }

    customerService = {
      createCustomers: jest.fn(),
    }

    linkService = {
      create: jest.fn(),
    }

    container = {
      resolve: jest.fn(key => {
        switch (key) {
          case PRISONER_MODULE:
            return prisonerService
          case Modules.CUSTOMER:
            return customerService
          case ContainerRegistrationKeys.LINK:
            return linkService
          default:
            throw new Error(`Unknown dependency: ${key}`)
        }
      }),
    }

    req = {
      body: {
        metadata: {
          prisonId: 'ASI123',
          offenderNo: 'STU999',
        },
      },
      scope: container,
    }
    res = {
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('returns 200, when prisoner exists and has customer ID associated', async () => {
    prisonerService.listPrisoners.mockResolvedValue([{ id: 'ASI123' }])
    await POST(req, res)

    expect(prisonerService.listPrisoners).toHaveBeenCalledWith({
      prison_id: 'ASI123',
      prisoner_id: 'STU999',
    })
    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })

  it('creates new prisoner, customer, link, and cart when prisoner does not exist', async () => {
    prisonerService.listPrisoners.mockResolvedValue([undefined])

    customerService.createCustomers.mockResolvedValue({
      id: 'cust_new',
    })

    prisonerService.createPrisoners.mockResolvedValue({
      id: 'prisoner_new',
    })

    await POST(req, res)

    expect(customerService.createCustomers).toHaveBeenCalledWith({
      metadata: {
        prisonId: 'ASI123',
        offenderNo: 'STU999',
      },
      has_account: false,
    })

    expect(prisonerService.createPrisoners).toHaveBeenCalledWith({
      prison_id: 'ASI123',
      prisoner_id: 'STU999',
    })

    expect(linkService.create).toHaveBeenCalledWith({
      [Modules.CUSTOMER]: { customer_id: 'cust_new' },
      prisoner: { prisoner_id: 'prisoner_new' },
    })

    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })
})
