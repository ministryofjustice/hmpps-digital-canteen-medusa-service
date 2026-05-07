import { AgentConfig } from '@ministryofjustice/hmpps-rest-client'

const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, requireInProduction = false): T | string {
    if (process.env[name]) {
        return process.env[name]
    }
    if (fallback !== undefined && (!production || !requireInProduction)) {
        return fallback
    }
    throw new Error(`Missing required env var: ${name}`)
}

const requiredInProduction = true

export const hmppsConfig = {
    auth: {
        url: get('HMPPS_AUTH_URL', 'https://sign-in-dev.hmpps.service.justice.gov.uk/auth'),
        timeout: {
            response: 10000,
            deadline: 10000,
        },
        agent: new AgentConfig(10000),
        systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
        systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },

    apis: {
        finance: {
            url: get('HMPPS_FINANCE_API_URL', 'https://finance-api-dev.hmpps.service.justice.gov.uk'),
            timeout: {
                response: 10000,
                deadline: 10000,
            },
            agent: new AgentConfig(10000),
        }
    },
}