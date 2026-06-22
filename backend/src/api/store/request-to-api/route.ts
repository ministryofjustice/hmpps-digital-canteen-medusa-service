import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import DigitalCanteenApiClient from '../../../client/DigitalCanteenApiClient'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const client = new DigitalCanteenApiClient()
  const apiResponse = await client.testCallToApi()
  res.status(200).json({ apiResponse })
}
