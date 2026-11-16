import { addToCartWorkflow, createCartWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { POST } from '../route'

jest.mock('@medusajs/medusa/core-flows', () => ({
  createCartWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),

  addToCartWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),
}))

describe('POST handler - /internal/canteen/carts/add-line-item', () => {
  let req: any
  let res: any
  let container: any
  let queryService: any

  beforeEach(() => {
    jest.clearAllMocks()

    const workflowInstance = {
      run: jest.fn().mockResolvedValue({
        result: { id: 'cart123' },
      }),
    }
    ;(createCartWorkflow as unknown as jest.Mock).mockReturnValue(workflowInstance)

    queryService = { graph: jest.fn() }
    container = {
      resolve: jest.fn(key => {
        switch (key) {
          case ContainerRegistrationKeys.QUERY:
            return queryService
          default:
            throw new Error(`Unknown dependency: ${key}`)
        }
      }),
    }

    req = {
      body: {
        metadata: {
          prisonId: 'ASI',
          offenderNo: '12345',
          cartId: '123',
          productVariantId: 'xyz',
        },
      },
      scope: container,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('404 when user details not provided', async () => {
    req.body.metadata.offenderNo = null
    await POST(req, res)

    // Response
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      status: 404,
      userMessage: 'Prisoner not found',
    })
  })

  it('Should find linked customer ID corresponding to customer ID', async () => {
    queryService.graph.mockResolvedValueOnce({
      data: [
        {
          id: 'prisoner-1',
          prisoner_id: '12345',
          customer: { id: 'customer-abc' },
        },
      ],
    })
    await POST(req, res)

    expect(queryService.graph).toHaveBeenCalledWith({
      entity: 'prisoner',
      fields: ['id', 'prisoner_id', 'customer.*'],
      filters: { prisoner_id: '12345' },
    })

    expect(res.json).toHaveBeenCalledWith({ cartId: '123' })
  })

  it('Where cart ID provided in request, use cart ID and add variant to corresponding cart', async () => {
    queryService.graph.mockResolvedValueOnce({
      data: [{ id: '123457', prisoner_id: 'prisxyz', customer: { id: 'customerabc' } }],
    })
    await POST(req, res)

    expect(addToCartWorkflow(req.scope).run).toHaveBeenCalledWith({
      input: {
        cart_id: '123',
        items: [
          {
            variant_id: 'xyz',
            quantity: 1,
            requires_shipping: false,
          },
        ],
      },
    })
    expect(createCartWorkflow).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ cartId: '123' })
  })

  it('Should create a new cart when no cartId provided', async () => {
    req.body.metadata.cartId = null
    queryService.graph
      .mockResolvedValueOnce({
        data: [{ id: '123457', prisoner_id: 'prisxyz', customer: { id: 'customerabc' } }],
      })
      .mockResolvedValueOnce({
        data: [{ id: 'sales_channel', name: 'ASI' }],
      })

    const regionService = { listRegions: jest.fn().mockResolvedValue([{ id: 'regionASI' }]) }
    container.resolve.mockImplementation(key => {
      switch (key) {
        case ContainerRegistrationKeys.QUERY:
          return queryService
        case 'region':
          return regionService
        default:
          throw new Error(`Unknown dependency: ${key}`)
      }
    })

    await POST(req, res)

    expect(res.json).toHaveBeenCalledWith({ cartId: 'cart123' })
  })
})
