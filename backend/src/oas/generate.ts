import fs from 'fs'
import swaggerJsdoc from 'swagger-jsdoc'

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Medusa API',
      description: 'Medusa API specifications',
      version: '1.0.0',
      contact: {
        name: 'HMPPS Digital Studio',
        email: 'feedback@digital.justice.gov.uk',
      },
    },
    components: {
      schemas: {
        CreateMedusaUserRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              $ref: '#/components/schemas/CreateMedusaUserMetaData',
            },
          },
        },
        CreateMedusaUserMetaData: {
          type: 'object',
          required: ['prison_id', 'offender_no'],
          properties: {
            prison_id: { type: 'string', description: 'The prison identifier', example: 'MDI' },
            offender_no: { type: 'string', description: "The prisoner's offender number", example: 'A1234BC' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'integer', example: 500 },
            errorCode: { type: 'string' },
            userMessage: { type: 'string' },
            developerMessage: { type: 'string' },
            moreInfo: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/api/internal/**/*.ts'],
})

fs.writeFileSync('./src/oas/internal.oas.json', JSON.stringify(spec, null, 2))
