import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { hmppsConfig } from '../config/hmpps-config'

let authClient: AuthenticationClient | null = null

export function getHmppsAuthClient(): AuthenticationClient {
    authClient ??= new AuthenticationClient(
        hmppsConfig.auth,
        console,
        new InMemoryTokenStore()
    )
    return authClient
}