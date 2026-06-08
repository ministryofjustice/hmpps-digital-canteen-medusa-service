import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const client = jwksClient({
    jwksUri: `${process.env.HMPPS_AUTH_URL}/.well-known/jwks.json`,
})

export async function validateHmppsToken(req, res, next) {
    const authHeader = req.headers.authorization

    console.log('authheader', authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing authorization token' })
    }

    const token = authHeader.split(' ')[1]

    try {
        console.log('HEREEEEE')
        // Verify signature against HMPPS Auth public key
        const decoded = jwt.decode(token, { complete: true })
        console.log('decoded', decoded)
        const key = await client.getSigningKey(decoded?.header.kid)
        console.log('key', key)
        const verified = jwt.verify(token, key.getPublicKey(), {
            algorithms: ['RS256'],
        }) as {
            client_id?: string
            authorities?: string[]
            iss?: string
        }
        console.log('verified', verified)
        // Check issuer
        const validIssuer = 'http://localhost:8080/auth/issuer'
        if (!verified.iss?.startsWith(validIssuer)) {
            return res.status(401).json({ message: 'Invalid token issuer' })
        }

        // Check client
        const allowedClients = ['hmpps-typescript-template-system']
        if (!allowedClients.includes(<string>verified.client_id)) {
            return res.status(403).json({ message: 'Client not authorised' })
        }

        next()
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token medusa' })
    }
}