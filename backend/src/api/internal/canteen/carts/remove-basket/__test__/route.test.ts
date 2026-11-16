import { Modules } from '@medusajs/framework/utils'
import { POST } from '../route'

jest.mock('@medusajs/medusa/core-flows', () => ({
  createCartWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),

  addToCartWorkflow: jest.fn().mockReturnValue({
    run: jest.fn().mockResolvedValue(undefined),
  }),
}))

describe('POST handler - /internal/canteen/carts/remove-basket', () => {
  let req: any
  let res: any
  let container: any
  let cartModuleService: any

  beforeEach(() => {
    jest.clearAllMocks()

    cartModuleService = { deleteCarts: jest.fn().mockResolvedValue(undefined) }

    container = {
      resolve: jest.fn(key => {
        switch (key) {
          case Modules.CART:
            return cartModuleService
          default:
            throw new Error(`Unknown dependency: ${key}`)
        }
      }),
    }

    req = {
      body: {
        metadata: {
          cartId: 'cart123',
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

  it('Should remove cart associated with cart ID from request', async () => {
    await POST(req, res)

    expect(cartModuleService.deleteCarts).toHaveBeenCalledWith('cart123')
    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })

  it('Should return 500 when delete Carts fails', async () => {
    cartModuleService.deleteCarts.mockRejectedValueOnce(new Error('pain and suffering'))
    await POST(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      errorCode: 'REMOVE_CART_FAILED',
      userMessage: 'Failed to remove cart',
      developerMessage: 'pain and suffering',
    })
  })
})
