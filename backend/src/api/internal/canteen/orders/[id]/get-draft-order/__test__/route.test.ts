import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { GET } from '../route'

describe('GET handler - /internal/canteen/get-draft-order/{id}', () => {
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
      params: { id: 'order_123' },
      scope: container,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('Where Draft order ID provided in request, and order exists', async () => {
    queryService.graph.mockResolvedValueOnce({
      data: [
        {
          id: 'order_123',
          status: 'draft',
          subtotal: '35',
          total: '35',
          items: [
            { title: 'orange', quantity: 2, unit_price: 10, subtotal: 20, total: '20' },
            { title: 'apple', quantity: '3', unit_price: '5', subtotal: 15, total: 15 },
          ],
        },
      ],
    })

    await GET(req, res)

    expect(queryService.graph).toHaveBeenCalledWith({
      entity: 'order',
      fields: [
        'id',
        'subtotal',
        'total',
        'status',
        'items.title',
        'items.quantity',
        'items.unit_price',
        'items.subtotal',
        'items.total',
      ],
      filters: { id: 'order_123', status: 'draft' },
    })
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({
      hasDraftOrder: true,
      items: [
        { title: 'orange', quantity: 2, unitPrice: 10, lineTotal: 20 },
        { title: 'apple', quantity: 3, unitPrice: 5, lineTotal: 15 },
      ],
      itemCount: 5,
      subtotal: 35,
      total: 35,
    })
  })

  it('returns hasDraftOrder false when no draft order matches', async () => {
    queryService.graph.mockResolvedValueOnce({ data: [] })

    await GET(req, res)

    expect(queryService.graph).toHaveBeenCalledWith({
      entity: 'order',
      fields: [
        'id',
        'subtotal',
        'total',
        'status',
        'items.title',
        'items.quantity',
        'items.unit_price',
        'items.subtotal',
        'items.total',
      ],
      filters: { id: 'order_123', status: 'draft' },
    })
    expect(res.json).toHaveBeenCalledWith({
      hasDraftOrder: false,
    })
  })

  it('Should return 500 when an error occurs', async () => {
    queryService.graph.mockRejectedValueOnce(new Error('Whoopsy'))
    await GET(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'GET_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to get draft order',
      developerMessage: 'Whoopsy',
    })
  })
})
