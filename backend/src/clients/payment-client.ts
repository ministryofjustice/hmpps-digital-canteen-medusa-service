import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { getHmppsAuthClient } from '../lib/hmpps-auth'
import { hmppsConfig } from '../config/hmpps-config'

interface Agency {
    agencyId: string
    description: string
    agencyType: string
    active: boolean
    // Add other fields as needed
}

export class HmppsPrisonClient extends RestClient {
    constructor() {
        super(
            'HMPPS Prison API',
            hmppsConfig.apis.prison,
            console,
            getHmppsAuthClient()
        )
    }

    /**
     * Get all agencies
     */
    async getAgencies(): Promise<Agency[]> {
        return this.get<Agency[]>(
            { path: '/api/agencies' },
            asSystem()
        )
    }
}