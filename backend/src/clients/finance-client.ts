import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import { getHmppsAuthClient } from '../lib/hmpps-auth'
import { hmppsConfig } from '../config/hmpps-config'

interface AddHoldRequest {
    description: string
    amount: number
    clientTransactionId: string
    clientName: string
    clientUniqueReference: string
    [key: string]: unknown
}

interface AddHoldResponse {
    holdNumber: number
}

interface ReleaseHoldAndCreateTransactionRequest {
    type: 'CANT'
    removeDescription: string
    createDescription: string
    clientTransactionId: string
    clientName: string
    removeClientUniqueReference: string
    createClientUniqueReference: string
    [key: string]: unknown
}

interface ReleaseHoldAndCreateTransactionResponse {
    id: string
}

interface ReleaseHoldRequest {
    description: string
    clientTransactionId: string
    clientName: string
    clientUniqueReference: string
    [key: string]: unknown
}

interface ReleaseHoldResponse {
    id: string
}

export class FinanceClient extends RestClient {
    constructor() {
        super(
            'HMPPS Finance API',
            hmppsConfig.apis.finance,
            console,
            getHmppsAuthClient()
        )
    }

    /**
     * Add a hold on prisoner's account (reserve funds)
     * Endpoint: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/add-hold
     * @param prisonId - Prison ID (e.g., "MDI")
     * @param offenderNo - Offender number (e.g., "A1234BC")
     * @param holdRequest - Hold details
     */
    async addHold(
        prisonId: string,
        offenderNo: string,
        holdRequest: AddHoldRequest
    ): Promise<AddHoldResponse> {
        return this.post<AddHoldResponse>(
            {
                path: `/api/finance-holds/prison/${prisonId}/offenders/${offenderNo}/add-hold`,
                data: holdRequest,
            },
            asSystem()
        )
    }

    /**
     * Release a hold and create transaction
     * Endpoint: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/release-hold-transaction/{holdNumber}
     * @param prisonId - Prison ID
     * @param offenderNo - Offender number
     * @param holdNumber - Hold number to release
     * @param releaseHoldAndCreateTransaction - Transaction details
     */
    async releaseHoldAndCreateTransaction(
        prisonId: string,
        offenderNo: string,
        holdNumber: number,
        releaseHoldAndCreateTransaction: ReleaseHoldAndCreateTransactionRequest
    ): Promise<ReleaseHoldAndCreateTransactionResponse> {
        return this.post<ReleaseHoldAndCreateTransactionResponse>(
            {
                path: `/api/finance-holds/prison/${prisonId}/offenders/${offenderNo}/release-hold-transaction/${holdNumber}`,
                data: releaseHoldAndCreateTransaction,
            },
            asSystem()
        )
    }

    /**
     * Release a hold
     * Endpoint: POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/release-hold/{holdNumber}
     * @param prisonId - Prison ID
     * @param offenderNo - Offender number
     * @param holdNumber - Hold number to release
     * @param releaseRequest - Release details
     */
    async releaseHold(
        prisonId: string,
        offenderNo: string,
        holdNumber: number,
        releaseRequest: ReleaseHoldRequest
    ): Promise<ReleaseHoldResponse> {
        return this.post<ReleaseHoldResponse>(
            {
                path: `/api/finance-holds/prison/${prisonId}/offenders/${offenderNo}/release-hold/${holdNumber}`, // ← Fixed: was release-hold-transaction
                data: releaseRequest,
            },
            asSystem()
        )
    }
}