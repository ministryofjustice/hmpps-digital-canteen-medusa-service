import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { getHmppsAuthClient } from '../lib/hmpps-auth'
import { apiConfig } from '../config/api-config'

export default class DigitalCanteenApiClient extends RestClient {
  constructor() {
    super('Digital canteen API', apiConfig.apis.hmpps_digital_canteen_api, console, getHmppsAuthClient())
  }

  /**
   * Test hmpps digital canteen api
   */
  async testCallToApi(): Promise<string> {
    return this.get<string>({ path: `/test-request-to-api` }, asSystem())
  }
}
