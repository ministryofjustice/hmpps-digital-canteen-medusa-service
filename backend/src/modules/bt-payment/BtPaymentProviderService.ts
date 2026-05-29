import {AbstractPaymentProvider, PaymentSessionStatus} from "@medusajs/framework/utils";
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
    type RefundPaymentInput, type RefundPaymentOutput,
    type RetrievePaymentInput,
    type RetrievePaymentOutput,
    type UpdatePaymentInput,
    type UpdatePaymentOutput, type WebhookActionResult
} from "@medusajs/framework/types";
import {HmppsFinanceProviderOptions, HmppsPaymentData} from "../payment-finance/types";
import {FinanceClient} from "../../clients/finance-client";

class BtPaymentProviderService extends AbstractPaymentProvider<HmppsFinanceProviderOptions>  {
    static identifier = "bt-payment"
    static PROVIDER = "bt-payment"

    protected options_: HmppsFinanceProviderOptions
    protected financeClient_: FinanceClient

    constructor(container: any, options: HmppsFinanceProviderOptions) {
        super(container, options)
        this.options_ = options
        this.financeClient_ = new FinanceClient()
    }

    /**
     * Initialize a new payment session
     */
    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {

        console.log("INITIATING  payment for prisoner:")
        return {
            ...input.data,
            id: `mock_${Date.now()}`,
        };
    }

    /**
     * Authorize payment

     */
    async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
        console.log("AUTHORIZING payment for prisoner:")

        // here we will do BT payment authorization and payment
        // assuming success = return AUTHORIZED
        // assuming failure = return ERROR
        return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: {
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
    async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
        console.log("CAPTURING payment for prisoner:")
        return { data: input.data };
    }

    /**
     * NOT IMPLEMENTED
     * "This method cancels a payment in the third-party payment provider.
     * It's used when the admin user cancels an order. The order can only be canceled if the payment is not captured yet."
     */
    async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     * "When a customer chooses a payment method during checkout, then chooses a different one,
     * this method is triggered to delete the previous payment session.
     *
     * If your provider doesn't support deleting a payment session, you can just return an empty
     * object or an object that contains the same received data property."
     */
    async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     * "This method updates a payment in the third-party service that was previously
     * initiated with the initiatePayment method."
     */
    async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     * "This method gets the status of a payment session based on the status in the third-party integration."
     */
    async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     * "This method retrieves the payment's data from the third-party payment provider."
     */
    async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     */
    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
        throw new Error("not implemented yet")
    }

    /**
     * NOT IMPLEMENTED
     */
    getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
        throw new Error("not implemented yet")
    }
}

export default BtPaymentProviderService;