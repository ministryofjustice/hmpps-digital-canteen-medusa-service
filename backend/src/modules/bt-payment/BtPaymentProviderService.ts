import { AbstractPaymentProvider, PaymentSessionStatus } from '@medusajs/framework/utils'
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

class BtPaymentProviderService extends AbstractPaymentProvider {
  static identifier = 'bt-payment'

  static PROVIDER = 'bt-payment'

  constructor(container: any, options: any) {
    super(container, options)
  }

  /**
   * Initialize a new payment session
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    console.log('INITIATING  payment for prisoner:')
    return {
      ...input.data,
      id: `mock_${Date}`,
    }
  }

  /**
     * Authorize payment

     */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    console.log('AUTHORIZING payment for prisoner:')

    // here we will do BT payment authorization and payment
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {},
    }
  }

  /**
   * Capture payment
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    console.log('CAPTURING payment for prisoner:')
    return { data: input.data }
  }

  /**
   * NOT IMPLEMENTED
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new Error('not implemented yet')
  }

  /**
   * NOT IMPLEMENTED
   */
  getWebhookActionAndData(data: ProviderWebhookPayload['payload']): Promise<WebhookActionResult> {
    throw new Error('not implemented yet')
  }
}

export default BtPaymentProviderService
