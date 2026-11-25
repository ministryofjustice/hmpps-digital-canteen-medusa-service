import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  createOrderWorkflow,
  beginDraftOrderEditWorkflow,
  addDraftOrderItemsWorkflow,
  confirmDraftOrderEditWorkflow,
  cancelDraftOrderEditWorkflow,
  updateCartWorkflow,
  updateDraftOrderItemWorkflow,
} from '@medusajs/medusa/core-flows'
import { POST } from '../route'

jest.mock('@medusajs/medusa/core-flows', () => ({
  createOrderWorkflow: jest.fn(),
  beginDraftOrderEditWorkflow: jest.fn(),
  addDraftOrderItemsWorkflow: jest.fn(),
  confirmDraftOrderEditWorkflow: jest.fn(),
  cancelDraftOrderEditWorkflow: jest.fn(),
  updateCartWorkflow: jest.fn(),
  updateDraftOrderItemWorkflow: jest.fn(),
}))

const testCart = (overrides: Record<string, any> = {}) => ({
  id: 'cart_123',
  customer_id: 'cus_123',
  region_id: 'reg_123',
  currency_code: 'gbp',
  email: 'test@example.com',
  sales_channel_id: 'sc_123',
  metadata: null,
  items: [
    { id: 'item1', variant_id: 'variant_orange', title: 'orange', quantity: 2, unit_price: '10' },
    { id: 'item2', variant_id: 'variant_apple', title: 'apple', quantity: 3, unit_price: 5 },
  ],
  ...overrides,
})

const CART_FIELDS = [
  'id',
  'customer_id',
  'region_id',
  'currency_code',
  'email',
  'sales_channel_id',
  'metadata',
  'items.id',
  'items.variant_id',
  'items.title',
  'items.quantity',
  'items.unit_price',
]

const DRAFT_ORDER_FIELDS = [
  'id',
  'status',
  'is_draft_order',
  'currency_code',
  'items.id',
  'items.variant_id',
  'items.quantity',
]

describe('POST handler - /internal/canteen/orders/{id}/create-draft-order', () => {
  let req: any
  let res: any
  let container: any
  let queryService: any

  let createOrderRun: jest.Mock
  let beginEditRun: jest.Mock
  let updateItemRun: jest.Mock
  let addItemsRun: jest.Mock
  let confirmEditRun: jest.Mock
  let cancelEditRun: jest.Mock
  let updateCartRun: jest.Mock

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
      params: { id: 'cart_123' },
      body: { data: {} },
      scope: container,
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    createOrderRun = jest.fn().mockResolvedValue({ result: { id: 'order_123' } })
    beginEditRun = jest.fn().mockResolvedValue({})
    updateItemRun = jest.fn().mockResolvedValue({})
    addItemsRun = jest.fn().mockResolvedValue({})
    confirmEditRun = jest.fn().mockResolvedValue({})
    cancelEditRun = jest.fn().mockResolvedValue({})
    updateCartRun = jest.fn().mockResolvedValue({})

    ;(createOrderWorkflow as unknown as jest.Mock).mockReturnValue({ run: createOrderRun })
    ;(beginDraftOrderEditWorkflow as unknown as jest.Mock).mockReturnValue({ run: beginEditRun })
    ;(updateDraftOrderItemWorkflow as unknown as jest.Mock).mockReturnValue({ run: updateItemRun })
    ;(addDraftOrderItemsWorkflow as unknown as jest.Mock).mockReturnValue({ run: addItemsRun })
    ;(confirmDraftOrderEditWorkflow as unknown as jest.Mock).mockReturnValue({ run: confirmEditRun })
    ;(cancelDraftOrderEditWorkflow as unknown as jest.Mock).mockReturnValue({ run: cancelEditRun })
    ;(updateCartWorkflow as unknown as jest.Mock).mockReturnValue({ run: updateCartRun })
  })

  describe('cart validation', () => {
    it('returns 404 when cart is not found', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [] })

      await POST(req, res)

      expect(queryService.graph).toHaveBeenCalledWith({
        entity: 'cart',
        fields: CART_FIELDS,
        filters: { id: 'cart_123' },
      })
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        errorCode: 'CART_NOT_FOUND',
        userMessage: 'Cart not found',
        developerMessage: 'Cart cart_123 not found',
      })
      expect(createOrderRun).not.toHaveBeenCalled()
    })

    it('returns 400 when cart has already been submitted', async () => {
      queryService.graph.mockResolvedValueOnce({
        data: [testCart({ metadata: { cart_submitted: true } })],
      })

      await POST(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        errorCode: 'CART_ALREADY_SUBMITTED',
        userMessage: 'This cart has already been submitted',
        developerMessage: 'Cart cart_123 has already been submitted to a draft order',
      })
      expect(createOrderRun).not.toHaveBeenCalled()
      expect(updateCartRun).not.toHaveBeenCalled()
    })

    it('returns 400 when cart has no items', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart({ items: [] })] })

      await POST(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        errorCode: 'CART_EMPTY',
        userMessage: 'Cart has no items',
        developerMessage: 'Cart cart_123 has no items to add to draft order',
      })
      expect(createOrderRun).not.toHaveBeenCalled()
    })
  })

  describe('Where no draft order ID provided in request', () => {
    it('creates a new draft order from cart items and marks the cart as submitted', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] })

      await POST(req, res)

      expect(createOrderWorkflow).toHaveBeenCalledWith(container)
      expect(createOrderRun).toHaveBeenCalledWith({
        input: {
          status: 'draft',
          is_draft_order: true,
          region_id: 'reg_123',
          currency_code: 'gbp',
          email: 'test@example.com',
          customer_id: 'cus_123',
          sales_channel_id: 'sc_123',
          items: [
            { variant_id: 'variant_orange', quantity: 2, title: 'orange', unit_price: 10 },
            { variant_id: 'variant_apple', quantity: 3, title: 'apple', unit_price: 5 },
          ],
          metadata: { source_cart_id: 'cart_123' },
        },
      })
      expect(updateCartRun).toHaveBeenCalledWith({
        input: {
          id: 'cart_123',
          metadata: {
            cart_submitted: true,
            draft_order_id: 'order_123',
          },
        },
      })
      expect(beginEditRun).not.toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ draftOrderId: 'order_123' })
    })

    it('Should return 500 when createOrderWorkflow fails', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] })
      createOrderRun.mockRejectedValueOnce(new Error('Some failure'))

      await POST(req, res)

      expect(updateCartRun).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        errorCode: 'CREATE_DRAFT_ORDER_FAILED',
        userMessage: 'Failed to create a draft order',
        developerMessage: 'Some failure',
      })
    })
  })

  describe('Where draft order ID provided in request', () => {
    beforeEach(() => {
      req.body = { data: { draftOrderId: 'order_123' } }
    })

    it('updates existing line item quantities, add new line items, marks the cart as submitted', async () => {
      queryService.graph
        .mockResolvedValueOnce({
          data: [
            testCart({
              items: [
                { id: 'item1', variant_id: 'variant_orange', title: 'orange', quantity: 2, unit_price: 10 },
                { id: 'item2', variant_id: 'variant_apple', title: 'apple', quantity: 3, unit_price: 5 },
              ],
            }),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 'order_123',
              status: 'draft',
              is_draft_order: true,
              currency_code: 'gbp',
              items: [{ id: 'line_orange', variant_id: 'variant_orange', quantity: '1' }],
            },
          ],
        })

      await POST(req, res)

      expect(queryService.graph).toHaveBeenNthCalledWith(2, {
        entity: 'order',
        fields: DRAFT_ORDER_FIELDS,
        filters: { id: 'order_123' },
      })
      expect(beginEditRun).toHaveBeenCalledWith({
        input: { order_id: 'order_123', created_by: 'cus_123' },
      })
      expect(updateItemRun).toHaveBeenCalledWith({
        input: { order_id: 'order_123', items: [{ id: 'line_orange', quantity: 3 }] },
      })
      expect(addItemsRun).toHaveBeenCalledWith({
        input: {
          order_id: 'order_123',
          items: [{ variant_id: 'variant_apple', quantity: 3, title: 'apple', unit_price: 5 }],
        },
      })
      expect(confirmEditRun).toHaveBeenCalledWith({
        input: { order_id: 'order_123', confirmed_by: 'cus_123' },
      })
      expect(cancelEditRun).not.toHaveBeenCalled()
      expect(createOrderRun).not.toHaveBeenCalled()

      const order = (m: jest.Mock) => m.mock.invocationCallOrder[0]
      expect(order(beginEditRun)).toBeLessThan(order(updateItemRun))
      expect(order(updateItemRun)).toBeLessThan(order(addItemsRun))
      expect(order(addItemsRun)).toBeLessThan(order(confirmEditRun))
      expect(order(confirmEditRun)).toBeLessThan(order(updateCartRun))

      expect(updateCartRun).toHaveBeenCalledWith({
        input: {
          id: 'cart_123',
          metadata: {
            cart_submitted: true,
            draft_order_id: 'order_123',
          },
        },
      })
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ draftOrderId: 'order_123' })
    })

    it('only adds items i.e. variants in cart, have not been added in previous submissions', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] }).mockResolvedValueOnce({
        data: [
          {
            id: 'order_123',
            status: 'draft',
            is_draft_order: true,
            items: [{ variant_id: 'variant_banana', quantity: 1, title: 'banana', unit_price: 10 }],
          },
        ],
      })

      await POST(req, res)

      expect(updateItemRun).not.toHaveBeenCalled()
      expect(addItemsRun).toHaveBeenCalledWith({
        input: {
          order_id: 'order_123',
          items: [
            { variant_id: 'variant_orange', quantity: 2, title: 'orange', unit_price: 10 },
            { variant_id: 'variant_apple', quantity: 3, title: 'apple', unit_price: 5 },
          ],
        },
      })
      expect(confirmEditRun).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ draftOrderId: 'order_123' })
    })

    it('only updates items when all cart variants already exist in the draft order i.e. quantity change', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] }).mockResolvedValueOnce({
        data: [
          {
            id: 'order_123',
            status: 'draft',
            is_draft_order: true,
            items: [
              { id: 'line_orange', variant_id: 'variant_orange', quantity: 1 },
              { id: 'line_apple', variant_id: 'variant_apple', quantity: 1 },
            ],
          },
        ],
      })

      await POST(req, res)

      expect(updateItemRun).toHaveBeenCalledWith({
        input: {
          order_id: 'order_123',
          items: [
            { id: 'line_orange', quantity: 3 },
            { id: 'line_apple', quantity: 4 },
          ],
        },
      })
      expect(addItemsRun).not.toHaveBeenCalled()
      expect(confirmEditRun).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ draftOrderId: 'order_123' })
    })

    it('returns 404 when the order is no longer a draft', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] }).mockResolvedValueOnce({
        data: [{ id: 'order_123', status: 'pending', is_draft_order: false, items: [] }],
      })

      await POST(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        errorCode: 'DRAFT_ORDER_NOT_FOUND',
        userMessage: 'Draft order not found',
        developerMessage: 'Draft order order_123 not found or is no longer a draft',
      })
      expect(beginEditRun).not.toHaveBeenCalled()
      expect(updateCartRun).not.toHaveBeenCalled()
    })

    it('returns 404 when the draft order ID does not exist', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] }).mockResolvedValueOnce({ data: [] })

      await POST(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        status: 404,
        errorCode: 'DRAFT_ORDER_NOT_FOUND',
        userMessage: 'Draft order not found',
        developerMessage: 'Draft order order_123 not found or is no longer a draft',
      })
      expect(beginEditRun).not.toHaveBeenCalled()
    })

    it('cancels the edit and returns 500 when an edit step fails', async () => {
      queryService.graph.mockResolvedValueOnce({ data: [testCart()] }).mockResolvedValueOnce({
        data: [
          {
            id: 'order_123',
            status: 'draft',
            is_draft_order: true,
            items: [{ id: 'line_orange', variant_id: 'variant_orange', quantity: 1 }],
          },
        ],
      })
      updateItemRun.mockRejectedValueOnce(new Error('Edit exploded'))

      await POST(req, res)

      expect(cancelEditRun).toHaveBeenCalledWith({ input: { order_id: 'order_123' } })
      expect(addItemsRun).not.toHaveBeenCalled()
      expect(confirmEditRun).not.toHaveBeenCalled()
      expect(updateCartRun).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        status: 500,
        errorCode: 'CREATE_DRAFT_ORDER_FAILED',
        userMessage: 'Failed to create a draft order',
        developerMessage: 'Edit exploded',
      })
    })
  })

  it('Should return 500 when an error occurs', async () => {
    queryService.graph.mockRejectedValueOnce(new Error('Whoopsy'))

    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'CREATE_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to create a draft order',
      developerMessage: 'Whoopsy',
    })
  })
})
