import { AbstractPaymentProvider, PaymentSessionStatus } from '@medusajs/framework/utils'
import type {
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  MedusaContainer,
} from '@medusajs/framework/types'
import FinanceClient from '../../clients/finance-client'
import { HmppsFinanceProviderOptions, HmppsPaymentData } from './types'

class HmppsFinanceProviderService extends AbstractPaymentProvider<HmppsFinanceProviderOptions> {
  static identifier = 'payment-finance'

  static PROVIDER = 'payment-finance'

  protected options: HmppsFinanceProviderOptions

  protected financeClient: FinanceClient

  constructor(container: MedusaContainer, options: HmppsFinanceProviderOptions) {
    super(container, options)
    this.options = options
    this.financeClient = new FinanceClient()
  }

  /**
   * Initialize a new payment session
   * /store/payment-collections/{id}/payment-sessions
   *
   * HMPPS API: None
   *
   * @param input - Contains payment amount, currency, and prisoner data
   * @returns Payment session with PENDING status and stored prisoner details
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { context, data, amount } = input as InitiatePaymentInput & {
      context: Record<string, unknown>
      data: Record<string, unknown>
      amount: number
    }

    const prisonId = data?.prisonId as string
    const offenderNo = data?.offenderNo as string

    if (!prisonId || !offenderNo) {
      throw new Error('Missing required prisoner details (prisonId and offenderNo)')
    }

    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount')
    }

    const timestamp = Date.now()
    const contextAny = context
    const cartOrOrderId = contextAny?.resource_id || contextAny?.id || 'unknown'
    const randomCode = Math.floor(100000 + Math.random() * 900000)
    const clientTransactionId = `medusa${randomCode}`

    const sessionData: HmppsPaymentData = {
      prisonId,
      offenderNo,
      amount,
      clientTransactionId,
      clientUniqueReference: `${cartOrOrderId}-${timestamp}`,
    }

    return {
      id: sessionData.clientTransactionId,
      status: PaymentSessionStatus.PENDING,
      data: sessionData,
    }
  }

  /**
   * Authorize payment - Create hold on prisoner account
   * /store/carts/{{cart_id}}/complete
   *
   * HMPPS API: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/add-hold
   *
   * @param input - Contains payment session data with prisoner details and amount
   * @returns AUTHORIZED status with holdNumber stored in session data
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as HmppsPaymentData

    if (!data.amount) {
      throw new Error('Payment amount not found in session data')
    }

    const holdResponse = await this.financeClient.addHold(data.prisonId, data.offenderNo, {
      description: 'HOLD',
      amount: data.amount,
      clientTransactionId: data.clientTransactionId,
      clientName: this.options.clientName,
      clientUniqueReference: data.clientUniqueReference,
    })

    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...data,
        holdNumber: holdResponse.holdNumber,
        authorizedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Capture payment
   * "When an order is placed, the payment is authorized using the authorizePayment method. Then,
   * the admin user can capture the payment, which triggers this method."
   *
   * Options:
   * 1. Manually via admin portal "Capture payment" button, which will use this function
   * 2. Automatically via fulfillment module, which will use releaseHoldAndCreateTransaction directly
   *
   * HMPPS API: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/release-hold-transaction/{holdNumber}
   */
  async capturePayment(_input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   * "This method cancels a payment in the third-party payment provider.
   * It's used when the admin user cancels an order. The order can only be canceled if the payment is not captured yet."
   */
  async cancelPayment(_input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   * "When a customer chooses a payment method during checkout, then chooses a different one,
   * this method is triggered to delete the previous payment session.
   *
   * If your provider doesn't support deleting a payment session, you can just return an empty
   * object or an object that contains the same received data property."
   */
  async deletePayment(_input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   * "This method updates a payment in the third-party service that was previously
   * initiated with the initiatePayment method."
   */
  async updatePayment(_input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   * "This method gets the status of a payment session based on the status in the third-party integration."
   */
  async getPaymentStatus(_input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   * "This method retrieves the payment's data from the third-party payment provider."
   */
  async retrievePayment(_input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  getWebhookActionAndData(_data: ProviderWebhookPayload['payload']): Promise<WebhookActionResult> {
    throw new Error('not implemented yet')
  }
}

export default HmppsFinanceProviderService
