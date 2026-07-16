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
import { PaymentResult } from '../../api/store/pin-phone/carts/[id]/complete/route'

type InjectedDependencies = {
  logger: Logger
}

class BtPaymentProviderService extends AbstractPaymentProvider {
  static identifier = 'bt-payment'

  protected logger: Logger

  constructor(container: InjectedDependencies, options: Record<string, unknown>) {
    super(container, options)
    this.logger = container.logger
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const data = input.data as PaymentResult | undefined

    if (!data?.offender_no) {
      throw new Error('Missing required offender_no')
    }

    this.logger.info(`Initiating payment for prisoner ${data.offender_no}`)

    return {
      id: `bt_${randomUUID()}`,
      status: PaymentSessionStatus.PENDING,
      data: { ...data },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as PaymentResult | undefined

    if (data?.status !== 'AUTHORISED') {
      this.logger.error(`Payment failed for prisoner ${data?.offender_no}: ${data?.errorMessage}`)
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
        },
      }
    }

    this.logger.info(`Payment authorised for prisoner ${data.offender_no}, ref: ${data.transactionReference}`)

    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: { ...data },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data as PaymentResult | undefined

    this.logger.info(`Capturing payment for offender ${data?.offender_no}`)

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
