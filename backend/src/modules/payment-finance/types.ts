/**
 * Configuration options for HMPPS Finance Provider
 */
export interface HmppsFinanceProviderOptions {
  clientName: string
}

/**
 * Payment session data stored by the provider
 */
export interface HmppsPaymentData extends Record<string, unknown> {
  prisonId: string
  offenderNo: string
  holdNumber?: number
  clientTransactionId: string
  clientUniqueReference: string
  amount?: number
}
