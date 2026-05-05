import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FinanceClient } from "../../clients/finance-client"

/**
 * Test finance:
 * 1. Add hold (authorize)
 * 2. Remove hold
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as Partial<{
      prisonId: string
      offenderNo: string
      amount: number
      testCapture: boolean
    }>

    if (!body.prisonId || !body.offenderNo || !body.amount) {
      return res.status(400).json({
        success: false,
        error: "Missing prisonId, offenderNo or amount",
      })
    }

    const {
      prisonId,
      offenderNo,
      amount,
      testCapture = true
    } = body

    const financeClient = new FinanceClient()
    const timestamp = Date.now()

    console.log(`Prison: ${prisonId}, Offender: ${offenderNo}, Amount: £${amount / 100}`)

    // 1. Add hold
    const holdResponse = await financeClient.addHold(
        prisonId,
        offenderNo,
        {
          description: "HOLD",
          amount,
          clientTransactionId: `TEST1`,
          clientName: "Digital Canteen Test",
          clientUniqueReference: `TEST${timestamp}`,
        }
    )

    if (testCapture) {
      // 2. Release hold (CANT)
      const releaseResponse = await financeClient.releaseHold(
          prisonId,
          offenderNo,
          holdResponse.holdNumber,
          {
            type: "CANT",
            removeDescription: "Remove Hold",
            createDescription: "Hold for Food",
            clientTransactionId: `TEST1`,
            clientName: "Digital Canteen Test",
            removeClientUniqueReference: `remove${timestamp}`,
            createClientUniqueReference: `create${timestamp}`,
          }
      )

      return res.json({
        success: true,
        flow: 'hold → release',
        hold: holdResponse,
        release: releaseResponse,
        message: 'Hold released',
      })
    }

    return res.json({
      success: true,
      flow: 'hold only',
      hold: holdResponse,
      message: 'Hold created',
    })

  } catch (error: any) {
    console.error('✗ Payment flow test failed:', error)

    return res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    })
  }
}