import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HmppsPrisonClient } from "../../clients/payment-client"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
  try {
    console.log('Testing Prison API connection...')

    const prisonClient = new HmppsPrisonClient()
    const agencies = await prisonClient.getAgencies()

    console.log(`Successfully fetched ${agencies.length} agencies`)

    res.json({
      success: true,
      count: agencies.length,
      agencies: agencies.slice(0, 5), // Return first 5 for testing
      message: 'Prison API connection successful!'
    })
  } catch (error) {
    console.error('Error fetching agencies:', error)

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch agencies from Prison API',
      details: error
    })
  }
}