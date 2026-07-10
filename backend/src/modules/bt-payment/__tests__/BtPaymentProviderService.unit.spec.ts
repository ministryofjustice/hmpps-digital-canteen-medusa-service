import { PaymentSessionStatus } from '@medusajs/framework/utils'
import type {
  AuthorizePaymentInput,
  CapturePaymentInput,
  InitiatePaymentInput,
  Logger,
} from '@medusajs/framework/types'
import BtPaymentProviderService from '../BtPaymentProviderService'
import DigitalCanteenApiClient from '../../../client/DigitalCanteenApiClient'

jest.mock('../../../client/DigitalCanteenApiClient')

const MockedDigitalCanteenApiClient = DigitalCanteenApiClient as unknown as jest.Mock

const buildBtPaymentProvider = () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger

  const container: { logger: Logger } = {
    logger,
  }

  const btPaymentProviderService = new BtPaymentProviderService(container, {})
  return { btPaymentProviderService, logger, client: MockedDigitalCanteenApiClient.mock.instances[0] }
}

describe('BtPaymentProviderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initiate payment', () => {
    it('returns a pending session with a generated id', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      const result = await btPaymentProviderService.initiatePayment({
        data: { offender_no: 'ABC123', amount: 50 },
      } as unknown as InitiatePaymentInput)

      expect(result.id).toMatch(/^bt_/)
      expect(result.status).toBe(PaymentSessionStatus.PENDING)
      expect(result.data).toMatchObject({ offender_no: 'ABC123', amount: 50 })
    })

    it('throws error when offender_no is missing', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      await expect(
        btPaymentProviderService.initiatePayment({ data: { amount: 500 } } as unknown as InitiatePaymentInput),
      ).rejects.toThrow('offender_no')
    })

    it('throws error when amount is zero', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      await expect(
        btPaymentProviderService.initiatePayment({
          data: { offender_no: 'ABC123', amount: 0 },
        } as unknown as InitiatePaymentInput),
      ).rejects.toThrow('payment amount')
    })

    it('throws error when amount is null', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      await expect(
        btPaymentProviderService.initiatePayment({
          data: { offender_no: 'ABC123' },
        } as unknown as InitiatePaymentInput),
      ).rejects.toThrow('payment amount')
    })

    it('throws error when amount is negative', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      await expect(
        btPaymentProviderService.initiatePayment({
          data: { offender_no: 'ABC123', amount: -10 },
        } as unknown as InitiatePaymentInput),
      ).rejects.toThrow('payment amount')
    })
  })

  describe('authorize payment', () => {
    it('returns AUTHORIZED when the API reports success', async () => {
      const { btPaymentProviderService, client } = buildBtPaymentProvider()

      ;(client.btPinPinPhonePaymentProcess as jest.Mock).mockResolvedValue({
        status: 'authorized',
        transactionBatchNumber: 'random ref',
        transactionReference: 'random ref',
        holdNumber: '123456',
        errorCode: undefined,
        errorMessage: undefined,
      })

      const result = await btPaymentProviderService.authorizePayment({
        data: { offender_no: 'ABC123', amount: 50 },
      } as unknown as AuthorizePaymentInput)

      expect(result.status).toBe(PaymentSessionStatus.AUTHORIZED)
      expect(result.data).toMatchObject({
        transactionBatchNumber: 'random ref',
        transactionReference: 'random ref',
        holdNumber: '123456',
      })
    })

    it('returns ERROR when the API reports error status', async () => {
      const { btPaymentProviderService, client } = buildBtPaymentProvider()

      ;(client.btPinPinPhonePaymentProcess as jest.Mock).mockResolvedValue({
        status: 'error',
        errorCode: 'BT_DIED_:c',
        errorMessage: 'BT service non responsive',
      })

      const result = await btPaymentProviderService.authorizePayment({
        data: { offender_no: 'ABC123', amount: 50 },
      } as unknown as AuthorizePaymentInput)

      expect(result.status).toBe(PaymentSessionStatus.ERROR)
      expect(result.data).toMatchObject({
        error_code: 'BT_DIED_:c',
        error_message: 'BT service non responsive',
      })
    })

    it('returns ERROR when error with API canteen service', async () => {
      const { btPaymentProviderService, client } = buildBtPaymentProvider()

      ;(client.btPinPinPhonePaymentProcess as jest.Mock).mockRejectedValue(new Error('some error'))

      const result = await btPaymentProviderService.authorizePayment({
        data: { offender_no: 'ABC123', amount: 50 },
      } as unknown as AuthorizePaymentInput)

      expect(result.status).toBe(PaymentSessionStatus.ERROR)
      expect(result.data).toMatchObject({
        error_code: 'PROVIDER_CALL_FAILED',
        error_message: 'some error',
      })
    })
  })

  describe('capture payment', () => {
    it('returns  with a captured_at timestamp', async () => {
      const { btPaymentProviderService } = buildBtPaymentProvider()

      const result = await btPaymentProviderService.capturePayment({
        data: { offender_no: 'ABC123', amount: 50 },
      } as unknown as CapturePaymentInput)

      expect(result.data).toHaveProperty('captured_at')
      expect(new Date(result.data!.captured_at as string).getTime()).not.toBeNaN()
    })
  })

  //  Unimplemented methods
  describe('unimplemented methods', () => {
    const methods = [
      'cancelPayment',
      'deletePayment',
      'updatePayment',
      'getPaymentStatus',
      'retrievePayment',
      'refundPayment',
      'getWebhookActionAndData',
    ] as const

    it.each(methods)('%s throws not implemented', async method => {
      const { btPaymentProviderService } = buildBtPaymentProvider()
      await expect(btPaymentProviderService[method]()).rejects.toThrow('not implemented')
    })
  })
})
