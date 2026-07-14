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

  const validPaymentResult = {
    offender_no: 'G916XXX',
    status: 'authorised',
    transactionBatchNumber: '12345',
    transactionReference: '12345',
    holdNumber: '54321',
    errorCode: null,
    errorMessage: null,
  }

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
        PaymentResult: validPaymentResult,
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
        data: { ...validPaymentResult },
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      order: { id: 'order_123' },
    })
  })

  it('returns 200 and returns error on payment error', async () => {
    cartModuleService.retrieveCart.mockResolvedValue({
      id: 'cart_123',
      items: [{ unit_price: 500 }],
    })

    req.body.PaymentResult = {
      offender_no: 'G916XXX',
      status: 'error',
      errorCode: 'BT ded :c',
      errorMessage: 'BT unreachable',
    }

    const mockedCompleteCartWorkflow = completeCartWorkflow as unknown as jest.Mock
    mockedCompleteCartWorkflow.mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error('Payment not authorised')),
    })

    await POST(req, res)

    expect(logger.error).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      code: 'BT ded :c',
      message: 'BT unreachable',
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
