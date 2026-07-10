import { AbstractPaymentProvider, PaymentSessionStatus } from '@medusajs/framework/utils'
import type {
  Logger,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentOutput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentOutput,
  RetrievePaymentOutput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from '@medusajs/framework/types'
import { randomUUID } from 'node:crypto'
import DigitalCanteenApiClient from '../../client/DigitalCanteenApiClient'

interface BtSessionData {
  offender_no: string
  amount: number
  status?: PaymentSessionStatus
  transactionBatchNumber?: string
  transactionReference?: string
  holdNumber?: string
  error_code?: string
  error_message?: string
  captured_at?: string
}

type InjectedDependencies = {
  logger: Logger
}

class BtPaymentProviderService extends AbstractPaymentProvider {
  static identifier = 'bt-payment'

  protected logger: Logger

  protected client: DigitalCanteenApiClient

  constructor(container: InjectedDependencies, options: Record<string, unknown>) {
    super(container, options)
    this.client = new DigitalCanteenApiClient()
    this.logger = container.logger
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const data = input.data as BtSessionData | undefined

    if (!data?.offender_no) {
      throw new Error('Missing required prisoner details (offender_no)')
    }
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid payment amount (must be greater than 0)')
    }

    this.logger.info(`Initiating payment for prisoner ${data.offender_no}`)

    return {
      id: `bt_${randomUUID()}`,
      status: PaymentSessionStatus.PENDING,
      data: { ...data },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as unknown as BtSessionData
    const { offender_no, amount } = data

    try {
      const result = await this.client.btPinPinPhonePaymentProcess(offender_no, amount)

      const status = result.status === 'authorized' ? PaymentSessionStatus.AUTHORIZED : PaymentSessionStatus.ERROR

      // Authorised when payment is successful
      // Error when payment fails, downstream service issue, or prisoner no longer has the funds to create hold
      // Reason for error will be populated via backend API
      return {
        status,
        data: {
          ...data,
          status,
          transactionBatchNumber: result.transactionBatchNumber,
          transactionReference: result.transactionReference,
          holdNumber: result.holdNumber,
          error_code: result.errorCode,
          error_message: result.errorMessage,
        },
      }
    } catch (err) {
      // For canteen api service errors, as medusa provider uses backend API as provider
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
          status: PaymentSessionStatus.ERROR,
          error_code: 'PROVIDER_CALL_FAILED',
          error_message: (err as Error).message,
        },
      }
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data as unknown as BtSessionData
    this.logger.info(`Capturing payment for prisoner ${data.offender_no}`)

    return {
      data: {
        ...data,
        captured_at: new Date().toISOString(),
      },
    }
  }

  // Unimplemented (required by AbstractPaymentProvider)
  async cancelPayment(): Promise<CancelPaymentOutput> {
    throw new Error('cancelPayment not implemented')
  }

  async deletePayment(): Promise<DeletePaymentOutput> {
    throw new Error('deletePayment not implemented')
  }

  async updatePayment(): Promise<UpdatePaymentOutput> {
    throw new Error('updatePayment not implemented')
  }

  async getPaymentStatus(): Promise<GetPaymentStatusOutput> {
    throw new Error('getPaymentStatus not implemented')
  }

  async retrievePayment(): Promise<RetrievePaymentOutput> {
    throw new Error('retrievePayment not implemented')
  }

  async refundPayment(): Promise<RefundPaymentOutput> {
    throw new Error('refundPayment not implemented')
  }

  async getWebhookActionAndData(): Promise<WebhookActionResult> {
    throw new Error('getWebhookActionAndData not implemented')
  }
}

export default BtPaymentProviderService
