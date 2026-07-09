import { AbstractPaymentProvider, ContainerRegistrationKeys, PaymentSessionStatus } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/framework/types'
import {
  type AuthorizePaymentInput,
  type AuthorizePaymentOutput,
  type CancelPaymentInput,
  type CancelPaymentOutput,
  type CapturePaymentInput,
  type CapturePaymentOutput,
  type DeletePaymentInput,
  type DeletePaymentOutput,
  type GetPaymentStatusInput,
  type GetPaymentStatusOutput,
  type InitiatePaymentInput,
  type InitiatePaymentOutput,
  type ProviderWebhookPayload,
  type RefundPaymentInput,
  type RefundPaymentOutput,
  type RetrievePaymentInput,
  type RetrievePaymentOutput,
  type UpdatePaymentInput,
  type UpdatePaymentOutput,
  type WebhookActionResult,
} from '@medusajs/framework/types'
import { randomUUID } from 'node:crypto'
import DigitalCanteenApiClient, { PaymentResult } from '../../client/DigitalCanteenApiClient'

class BtPaymentProviderService extends AbstractPaymentProvider {
  static identifier = 'bt-payment'

  static PROVIDER = 'bt-payment'

  protected client: DigitalCanteenApiClient

  protected logger: Logger

  constructor(container: Record<string, unknown>, options: Record<string, unknown> | undefined) {
    super(container, options)
    this.client = new DigitalCanteenApiClient()
    this.logger = container[ContainerRegistrationKeys.LOGGER] as Logger
  }

  /**
   * Initialize a new payment session
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    this.logger.info(`Initiating payment`)

    const sessionId = `bt_${randomUUID()}`
    const { data } = input as InitiatePaymentInput & {
      data: {
        offender_no: string
        amount: number
      }
    }
    const offenderNo = data?.offender_no
    const amount = data?.amount

    if (!offenderNo) {
      throw new Error('Missing required prisoner details (offenderNo)')
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount (cannot be 0 or null)')
    }

    return {
      id: sessionId,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...data,
      },
    }
  }

  /**
   * Authorize payment, calls backend API for actual payment processing
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { data } = input
    const offenderNo = data?.offender_no as string
    const amount = data?.amount as number

    let result: PaymentResult | undefined
    try {
      result = await this.client.btPinPinPhonePaymentProcess(offenderNo, amount)
    } catch (err) {
      // For service errors, as medusa provider uses backend API as provider
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...data,
          status: PaymentSessionStatus.ERROR,
          transactionBatchNumber: result?.transactionBatchNumber,
          transactionReference: result?.transactionReference,
          holdNumber: result?.holdNumber,
          error_code: 'PROVIDER_CALL_FAILED',
          error_message: (err as Error).message,
        },
      }
    }

    // Authorised when payment is successful
    // Error when payment fails, downstream service issue, or prisoner no longer has the funds to create hold
    // Reason for error will be populated via backend API
    let paymentStatus: PaymentSessionStatus
    if (result.status === 'authorized') paymentStatus = PaymentSessionStatus.AUTHORIZED
    else paymentStatus = PaymentSessionStatus.ERROR

    return {
      status: paymentStatus,
      data: {
        ...data,
        status: paymentStatus,
        transactionBatchNumber: result.transactionBatchNumber,
        transactionReference: result.transactionReference,
        holdNumber: result.holdNumber,
        error_code: result.errorCode,
        error_message: result.errorMessage,
      },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const { data } = input
    this.logger.info(`Capturing payment for prisoner ${data?.offender_no}`)

    return {
      data: {
        ...data,
        captured_at: new Date().toISOString(),
      },
    }
  }

  // from AbstractPaymentProvider
  // some methods may be implemented at later date
  private notImplemented(method: string): never {
    throw new Error(`${BtPaymentProviderService.PROVIDER}: ${method} is not implemented`)
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const { data } = input
    this.logger.info(`Canceling payment for prisoner ${data?.offender_no}`)
    return this.notImplemented('cancelPayment')
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const { data } = input
    this.logger.info(`Deleting payment for prisoner ${data?.offender_no}`)
    return this.notImplemented('deletePayment')
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { data } = input
    this.logger.info(`Updating payment for prisoner ${data?.offender_no}`)
    return this.notImplemented('updatePayment')
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { data } = input
    this.logger.info(`Getting payment status for prisoner ${data?.offender_no}`)
    return this.notImplemented('getPaymentStatus')
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const { data } = input
    this.logger.info(`Retrieving payment for prisoner ${data?.offender_no}`)
    return this.notImplemented('retrievePayment')
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { data } = input
    this.logger.info(`Refunding payment for prisoner ${data?.offender_no}`)
    return this.notImplemented('refundPayment')
  }

  getWebhookActionAndData(data: ProviderWebhookPayload['payload']): Promise<WebhookActionResult> {
    this.logger.info(`Getting webhook action and data for prisoner ${data}`)
    return this.notImplemented('getWebhookActionAndData')
  }
}

export default BtPaymentProviderService
