import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { createPaymentCollectionForCartWorkflow, completeCartWorkflow } from '@medusajs/medusa/core-flows'
import { POST } from '../route'

jest.mock('@medusajs/medusa/core-flows', () => ({
  createPaymentCollectionForCartWorkflow: jest.fn(),
  completeCartWorkflow: jest.fn(),
}))

describe('POST /store/pin-phone/carts/:id/complete', () => {
  let req: any
  let res: any
  let logger: any
  let cartModuleService: any
  let paymentModuleService: any

  beforeEach(() => {
    // Mock logger
    logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() }

    // Mock services
    cartModuleService = {
      retrieveCart: jest.fn().mockResolvedValue({
        id: 'cart_123',
        items: [],
      }),
    }

    paymentModuleService = {
      createPaymentSession: jest.fn().mockResolvedValue({
        id: 'pay_session_123',
      }),
      retrievePaymentSession: jest.fn(),
    }

    const mockedCreatePaymentCollectionForCartWorkflow = createPaymentCollectionForCartWorkflow as unknown as jest.Mock

    const mockedCompleteCartWorkflow = completeCartWorkflow as unknown as jest.Mock

    mockedCreatePaymentCollectionForCartWorkflow.mockReturnValue({
      run: jest.fn().mockResolvedValue({
        result: { id: 'payment_collection_123' },
      }),
    })

    mockedCompleteCartWorkflow.mockReturnValue({
      run: jest.fn().mockResolvedValue({
        result: { id: 'order_123' },
      }),
    })

    // Mock container scope
    req = {
      params: { id: 'cart_123' },
      body: {
        offender_no: 'G916XXX',
        items: [{ id: 'item_1', quantity: 1 }],
      },
      scope: {
        resolve: jest.fn(key => {
          switch (key) {
            case ContainerRegistrationKeys.LOGGER:
              return logger
            case Modules.CART:
              return cartModuleService
            case Modules.PAYMENT:
              return paymentModuleService
            case 'createPaymentCollectionForCartWorkflow':
              return createPaymentCollectionForCartWorkflow
            case 'completeCartWorkflow':
              return completeCartWorkflow
            default:
              throw new Error(`Unknown dependency: ${key}`)
          }
        }),
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('returns 200 and completes the cart when items exist', async () => {
    cartModuleService.retrieveCart.mockResolvedValue({
      id: 'cart_123',
      items: [{ unit_price: 500 }],
    })

    await POST(req, res)

    expect(cartModuleService.retrieveCart).toHaveBeenCalledWith('cart_123', {
      relations: ['items'],
    })

    expect(paymentModuleService.createPaymentSession).toHaveBeenCalledWith(
      'payment_collection_123',
      expect.objectContaining({
        provider_id: 'pp_bt-payment_bt-payment',
        amount: 500,
        currency_code: 'gbp',
        data: { offender_no: 'G916XXX', amount: 500 },
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      order: { id: 'order_123' },
    })
  })

  it('returns 400 and returns error on payment error', async () => {
    cartModuleService.retrieveCart.mockResolvedValue({
      id: 'cart_123',
      items: [{ unit_price: 500 }],
    })

    const mockedCompleteCartWorkflow = completeCartWorkflow as unknown as jest.Mock
    mockedCompleteCartWorkflow.mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error()),
    })

    paymentModuleService.retrievePaymentSession.mockResolvedValue({
      id: 'pay_session_123',
      data: {
        error_code: 'PROVIDER_DECLINED_INSUFFICIENT_FUNDS',
        error_message: 'Insufficient funds',
      },
    })

    await POST(req, res)

    expect(paymentModuleService.retrievePaymentSession).toHaveBeenCalledWith('pay_session_123')
    expect(logger.error).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Insufficient funds',
      code: 'PROVIDER_DECLINED_INSUFFICIENT_FUNDS',
    })
  })

  it('logs a warning and returns early when no cart items exist', async () => {
    cartModuleService.retrieveCart.mockResolvedValue({
      id: 'cart_123',
      items: [],
    })

    await POST(req, res)

    expect(logger.error).toHaveBeenCalledWith('No cart items found')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No cart items found',
    })
  })
})
