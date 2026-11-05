import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { POST } from '../route'

describe('POST handler - /internal/canteen/carts/get-basket', () => {
  let req: any
  let res: any
  let container: any
  let queryService: any

  beforeEach(() => {
    jest.clearAllMocks()

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
          offenderNo: 'XYZ123',
          cartId: 'cart123',
        },
      },
      scope: container,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('Where cart ID provided in request, current/active cart should correspond to that', async () => {
    queryService.graph.mockResolvedValueOnce({
      data: [
        {
          id: 'cart123',
          items: [{ id: '123', variant_id: 'variant1', title: 'cheese :)', quantity: 2, unit_price: 10 }],
        },
      ],
    })
    await POST(req, res)

    expect(queryService.graph).toHaveBeenCalledWith({
      entity: 'cart',
      fields: ['id', 'items.id', 'items.variant_id', 'items.title', 'items.quantity', 'items.unit_price'],
      filters: { id: 'cart123' },
    })
    expect(res.json).toHaveBeenCalledWith({
      cartId: 'cart123',
      items: [
        { lineItemId: '123', variantId: 'variant1', title: 'cheese :)', quantity: 2, unitPrice: 10, lineTotal: 20 },
      ],
      itemCount: 2,
      allItemsTotal: 20
    })
  })

  it('Where cart ID not in request, use prisoner ID to find any cart associated', async () => {
    req.body.metadata.cartId = null
    queryService.graph.mockResolvedValueOnce({
      data: [{ id: '1', prisoner_id: 'XYZ123', customer: { id: 'CUSXYZ' } }],
    })
    queryService.graph.mockResolvedValueOnce({
      data: [
        { id: 'cart123', items: [{ id: '123', variant_id: 'variant1', title: 'cheese', quantity: 1, unit_price: 9 }] },
      ],
    })

    await POST(req, res)

    expect(queryService.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'prisoner',
        filters: { prisoner_id: 'XYZ123' },
      }),
    )
    expect(queryService.graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'cart',
        filters: { customer_id: 'CUSXYZ' },
      }),
    )
    expect(res.json).toHaveBeenCalledWith({
      cartId: 'cart123',
      items: [{ lineItemId: '123', variantId: 'variant1', title: 'cheese', quantity: 1, unitPrice: 9, lineTotal: 9 }],
      itemCount: 1,
      allItemsTotal: 9
    })
  })

  it('Should return empty cart when no cart ID in request, and no cart found associated to prisoner', async () => {
    req.body.metadata.cartId = null
    queryService.graph.mockResolvedValueOnce({
      data: [{ id: '1', prisoner_id: 'XYZ123', customer: { id: 'CUSXYZ' } }],
    })
    queryService.graph.mockResolvedValueOnce({ data: [] })

    await POST(req, res)

    expect(res.json).toHaveBeenCalledWith({
      cartId: null,
      items: [],
      itemCount: 0,
      total: 0,
    })
  })

  it('Should return 500 when an error occurs', async () => {
    queryService.graph.mockRejectedValueOnce(new Error('Whoopsy'))
    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'GET_CART_FAILED',
      userMessage: 'Failed to get medusa cart',
      developerMessage: 'Whoopsy',
    })
  })
})
