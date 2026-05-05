import { FinanceClient } from "../../clients/finance-client"
import { HmppsFinanceProviderOptions, HmppsPaymentData } from "./types"
import { PaymentSessionStatus } from "@medusajs/framework/utils"

interface PaymentProviderError {
    error: string
    code?: string
    detail?: any
}

interface PaymentProviderSessionResponse {
    data: Record<string, unknown>
}

class HmppsFinanceProviderService {
    static identifier = "payment-finance"
    static PROVIDER = "payment-finance"  // ← Add this line

    protected options_: HmppsFinanceProviderOptions
    protected financeClient_: FinanceClient

    constructor(
        container: any,
        options: HmppsFinanceProviderOptions
    ) {
        this.options_ = options
        this.financeClient_ = new FinanceClient()
    }

    /**
     * Get current payment status
     */
    async getPaymentStatus(
        paymentSessionData: Record<string, unknown>
    ): Promise<PaymentSessionStatus> {
        const data = paymentSessionData as HmppsPaymentData

        if (data.holdNumber) {
            return PaymentSessionStatus.AUTHORIZED
        }

        return PaymentSessionStatus.PENDING
    }

    /**
     * Update payment session
     */
    async updatePayment(
        input: any
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const existingData = input.data as HmppsPaymentData

        // For now, just return existing data
        // You could update amounts, etc. here if needed
        return {
            data: existingData,
        }
    }

    /**
     * Initialize payment session (called when payment session is created)
     * No hold placed yet - just create session data
     */
    async initiatePayment(
        input: any
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        try {
            const { context } = input

            // Extract prisoner details from cart context
            const prisonId = context.metadata?.prisonId as string
            const offenderNo = context.metadata?.offenderNo as string

            if (!prisonId || !offenderNo) {
                return {
                    error: "Missing prisoner details",
                    code: "missing_prisoner_details",
                    detail: "prisonId and offenderNo are required in cart context"
                }
            }

            // Generate unique references
            const timestamp = Date.now()
            const cartOrOrderId = context.id || 'unknown'

            const sessionData: HmppsPaymentData = {
                prisonId,
                offenderNo,
                clientTransactionId: `MEDUSA-${timestamp}`,
                clientUniqueReference: `${cartOrOrderId}-${timestamp}`,
            }

            console.log('Payment session initiated:', sessionData)

            return {
                data: sessionData,
            }
        } catch (error) {
            console.error('Error initiating payment:', error)
            return {
                error: error.message,
                code: "initiate_payment_failed",
                detail: error
            }
        }
    }

    /**
     * CREATE HOLD on prisoner account
     */
    async authorizePayment(
        paymentSessionData: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<PaymentProviderError | {
        status: PaymentSessionStatus
        data: PaymentProviderSessionResponse["data"]
    }> {
        try {
            const data = paymentSessionData as HmppsPaymentData
            const amount = context.amount as number

            console.log(`Authorizing payment: £${amount / 100} for ${data.offenderNo}`)

            // Create hold on prisoner account (the "HOA" call)
            const holdResponse = await this.financeClient_.addHold(
                data.prisonId,
                data.offenderNo,
                {
                    description: "HOLD",
                    amount: amount,
                    clientTransactionId: data.clientTransactionId,
                    clientName: this.options_.clientName,
                    clientUniqueReference: data.clientUniqueReference,
                }
            )

            console.log(`Hold created: ${holdResponse.holdNumber}`)

            // Update session data with hold number
            const updatedData: HmppsPaymentData = {
                ...data,
                holdNumber: holdResponse.holdNumber,
            }

            return {
                status: PaymentSessionStatus.AUTHORIZED,
                data: updatedData,
            }
        } catch (error) {
            console.error('Error authorizing payment:', error)
            return {
                error: error.message || 'Failed to authorize payment',
                code: error.code || "authorize_payment_failed",
                detail: error
            }
        }
    }

    /**
     * Capture payment - CONVERT HOLD to actual transaction
     */
    async capturePayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        try {
            const data = paymentData as HmppsPaymentData

            if (!data.holdNumber) {
                return {
                    error: "No hold number found",
                    code: "missing_hold_number",
                    detail: "Cannot capture payment without a hold"
                }
            }

            console.log(`Capturing payment - hold ${data.holdNumber}`)

            // Release hold as COMPLETION (converts to actual transaction)
            await this.financeClient_.releaseHold(
                data.prisonId,
                data.offenderNo,
                data.holdNumber,
                {
                    type: "CANT",
                    removeDescription: "Complete payment",
                    createDescription: "Order payment",
                    clientTransactionId: `${data.clientTransactionId}-CAPTURE`,
                    clientName: this.options_.clientName,
                    removeClientUniqueReference: data.clientUniqueReference,
                    createClientUniqueReference: data.clientUniqueReference,
                }
            )

            console.log('Payment captured successfully')

            return data
        } catch (error) {
            console.error('Error capturing payment:', error)
            return {
                error: error.message,
                code: "capture_payment_failed",
                detail: error
            }
        }
    }

    /**
     * Delete payment session
     * If hold exists, release it as CANT (cancelled)
     */
    async deletePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        try {
            const data = paymentSessionData as HmppsPaymentData

            if (data.holdNumber) {
                console.log('Deleting payment session - releasing hold')

                await this.financeClient_.releaseHold(
                    data.prisonId,
                    data.offenderNo,
                    data.holdNumber,
                    {
                        type: "CANT",
                        removeDescription: "Payment session deleted",
                        createDescription: "Hold released",
                        clientTransactionId: `${data.clientTransactionId}-DELETE`,
                        clientName: this.options_.clientName,
                        removeClientUniqueReference: data.clientUniqueReference,
                        createClientUniqueReference: data.clientUniqueReference,
                    }
                )
            }

            return {}
        } catch (error) {
            console.error('Error deleting payment:', error)
            return {
                error: error.message,
                code: "delete_payment_failed",
                detail: error
            }
        }
    }

    /**
     * Cancel payment - RELEASE HOLD without capturing
     */
    async cancelPayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        try {
            const data = paymentData as HmppsPaymentData

            if (data.holdNumber) {
                console.log(`Cancelling payment - hold ${data.holdNumber}`)

                await this.financeClient_.releaseHold(
                    data.prisonId,
                    data.offenderNo,
                    data.holdNumber,
                    {
                        type: "CANT",
                        removeDescription: "Payment cancelled",
                        createDescription: "Hold released",
                        clientTransactionId: `${data.clientTransactionId}-CANCEL`,
                        clientName: this.options_.clientName,
                        removeClientUniqueReference: data.clientUniqueReference,
                        createClientUniqueReference: data.clientUniqueReference,
                    }
                )

                console.log('Payment cancelled successfully')
            }

            return data
        } catch (error) {
            console.error('Error cancelling payment:', error)
            return {
                error: error.message,
                code: "cancel_payment_failed",
                detail: error
            }
        }
    }

    /**
     * Refund payment
     */
    async refundPayment(
        paymentData: Record<string, unknown>,
        refundAmount: number
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        console.warn('Refund not yet implemented')
        return paymentData as HmppsPaymentData
    }

}

export default HmppsFinanceProviderService