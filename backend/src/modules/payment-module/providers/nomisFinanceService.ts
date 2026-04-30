// import { AbstractPaymentProvider } from "@medusajs/framework/utils"
// import { Logger } from "@medusajs/framework/types"
//
// type Options = {
//   apiKey: string
// }
//
// type InjectedDependencies = {
//   logger: Logger
// }
//
// interface NomisFinanceOptions {
//   api_url: string
//   api_key: string
// }
//
// interface NomisPaymentData {
//   prisonId: string
//   offenderNo: string
//   holdNumber?: string
//   amount: number
// }
//
// class NomisFinancePaymentProvider extends AbstractPaymentProvider<Options> {
//   static identifier = "nomis-finance"
//
//   private nomisApiUrl: string
//   private apiKey: string
//
//   constructor(container, options: NomisFinanceOptions) {
//     super(container, options)
//     this.nomisApiUrl = options.api_url
//     this.apiKey = options.api_key
//   }
//
//   /**
//    * Authorize payment by adding a hold on offender funds
//    * Maps to: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/add-hold
//    */
//   async authorizePayment(
//       paymentSessionData: Record<string, unknown>,
//       context: Record<string, unknown>
//   ): Promise<PaymentProcessorError | { status: string; data: Record<string, unknown> }> {
//     const { prisonId, offenderNo, amount } = paymentSessionData as NomisPaymentData
//
//     try {
//       const response = await fetch(
//           `${this.nomisApiUrl}/api/finance-holds/prison/${prisonId}/offenders/${offenderNo}/add-hold`,
//           {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${this.apiKey}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               amount,
//               reference: context.order_id,
//               description: `Canteen order ${context.order_id}`,
//               // Add any other required fields from NOMIS API spec
//             })
//           }
//       )
//
//       if (!response.ok) {
//         throw new Error(`NOMIS API error: ${response.status} ${response.statusText}`)
//       }
//
//       const holdData = await response.json()
//
//       return {
//         status: "authorized",
//         data: {
//           ...paymentSessionData,
//           holdNumber: holdData.holdNumber, // Store hold number for later operations
//           holdId: holdData.id,
//           authorizedAt: new Date().toISOString()
//         }
//       }
//     } catch (error) {
//       return {
//         error: error.message,
//         code: "nomis_add_hold_failed",
//         detail: error
//       }
//     }
//   }
//
// }
//
// export default NomisFinancePaymentProvider