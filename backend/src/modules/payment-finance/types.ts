/**
 * Configuration options for HMPPS Finance Provider
 */
export interface HmppsFinanceProviderOptions {
    clientName: string  // Your application name (e.g., "Digital Canteen")
}

/**
 * Payment session data stored by the provider
 * Extends Record<string, unknown> to be compatible with Medusa's type system
 */
export interface HmppsPaymentData extends Record<string, unknown> {
    prisonId: string
    offenderNo: string
    holdNumber?: number
    clientTransactionId: string
    clientUniqueReference: string
}