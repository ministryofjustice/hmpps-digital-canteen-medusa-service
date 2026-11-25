import { cancelOrderWorkflow } from '@medusajs/medusa/core-flows'
import { POST } from '../route'

jest.mock('@medusajs/core-flows', () => ({
  cancelOrderWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),
}))

describe('POST /internal/canteen/cancel-draft-order', () => {
  let req: any
  let res: any

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      body: {
        data: {
          draftOrderId: 'order_123',
        },
      },
      scope: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('cancels the draft order and returns its id', async () => {
    await POST(req, res)

    expect(cancelOrderWorkflow).toHaveBeenCalledWith(req.scope)
    expect(cancelOrderWorkflow(req.scope).run).toHaveBeenCalledWith({
      input: {
        order_id: 'order_123',
      },
    })
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ orderId: 'order_123' })
  })

  it('returns 500 when the workflow fails', async () => {
    ;(cancelOrderWorkflow as unknown as jest.Mock).mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error('Some failure')),
    })
    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'CANCEL_DRAFT_ORDER_FAILED',
      userMessage: 'Failed to cancel draft order cart',
      developerMessage: 'Some failure',
    })
  })
})
