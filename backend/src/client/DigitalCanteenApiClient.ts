import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { getHmppsAuthClient } from '../lib/hmpps-auth'
import { apiConfig } from '../config/api-config'

export interface PaymentResult {
  // todo: this is proposed payment result, will be further refined during backend payment implementation
  status: 'authorized' | 'error'
  transactionBatchNumber?: string
  transactionReference?: string
  holdNumber?: number
  errorCode?: string
  errorMessage?: string
}

export default class DigitalCanteenApiClient extends RestClient {
  constructor() {
    super('Digital canteen API', apiConfig.apis.hmpps_digital_canteen_api, console, getHmppsAuthClient())
  }

  /**
   * Test hmpps digital canteen api
   */
  async testCallToApi(): Promise<string> {
    return this.get<string>({ path: `/api/test-request-to-api` }, asSystem())
  }

  /**
   * Process BT Pin Phone Credit payment
   */
  async btPinPinPhonePaymentProcess(offenderNo: string, amount: number): Promise<PaymentResult> {
    return this.post<PaymentResult>(
      {
        path: `/api/bt-pin-phone-payment-process/${offenderNo}/${amount}`,
      },
      asSystem(),
    )
  }
}
