import { deleteLineItemsWorkflow, updateLineItemInCartWorkflow } from '@medusajs/medusa/core-flows'
import { POST } from '../route'

jest.mock('@medusajs/medusa/core-flows', () => ({
  deleteLineItemsWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),
  updateLineItemInCartWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),
}))

describe('POST handler - /internal/canteen/carts/update-line-item', () => {
  let req: any
  let res: any

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      body: {
        metadata: {
          cartId: 'cart123',
          lineItemId: 'line123',
          quantity: 2,
        },
      },
      scope: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('Should update quantity when quantity in request is greater than 0', async () => {
    await POST(req, res)

    expect(updateLineItemInCartWorkflow).toHaveBeenCalledWith(req.scope)
    expect(updateLineItemInCartWorkflow(req.scope).run).toHaveBeenCalledWith({
      input: {
        cart_id: 'cart123',
        item_id: 'line123',
        update: { quantity: 2 },
      },
    })
    expect(deleteLineItemsWorkflow).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ cartId: 'cart123' })
  })

  it('Should delete line item when quantity in request is 0', async () => {
    req.body.metadata.quantity = 0

    await POST(req, res)

    expect(deleteLineItemsWorkflow).toHaveBeenCalledWith(req.scope)
    expect(deleteLineItemsWorkflow(req.scope).run).toHaveBeenCalledWith({
      input: {
        cart_id: 'cart123',
        ids: ['line123'],
      },
    })
    expect(updateLineItemInCartWorkflow).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ cartId: 'cart123' })
  })

  it('Should delete line item when quantity in request is negative', async () => {
    req.body.metadata.quantity = -1

    await POST(req, res)

    expect(deleteLineItemsWorkflow).toHaveBeenCalledWith(req.scope)
    expect(res.json).toHaveBeenCalledWith({ cartId: 'cart123' })
  })

  it('Should return 500 on error', async () => {
    ;(updateLineItemInCartWorkflow as unknown as jest.Mock).mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error('Some failure')),
    })
    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'REMOVE_LINE_ITEM_FAILED',
      userMessage: 'Failed to remove item from cart',
      developerMessage: 'Some failure',
    })
  })
})
