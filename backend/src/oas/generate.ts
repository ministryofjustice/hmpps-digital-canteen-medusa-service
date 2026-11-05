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
          required: ['prisonId', 'offenderNo'],
          properties: {
            prisonId: { type: 'string', description: 'The prison identifier', example: 'MDI' },
            offenderNo: { type: 'string', description: "The prisoner's offender number", example: 'A1234BC' },
          },
        },
        GetBasketRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              $ref: '#/components/schemas/GetBasketRequestMetadata',
            },
          },
        },
        GetBasketRequestMetadata: {
          type: 'object',
          required: ['offenderNo'],
          properties: {
            offenderNo: { type: 'string', description: "The prisoner's offender number", example: 'A1234BC' },
            cartId: {
              type: 'string',
              description: 'ID of medusa cart, if already created',
              example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W',
            },
          },
        },
        GetBasketResponse: {
          type: 'object',
          properties: {
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6GHP256ZVB7N9MVKTNBG73A' },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BasketLineItem',
              },
            },
            itemCount: { type: 'integer', description: 'Total quantity of all items', example: 5 },
            allItemsTotal: { type: 'integer', description: 'Total value of all itemsin basket', example: 50 },
          },
        },
        BasketLineItem: {
          type: 'object',
          properties: {
            lineItemId: {
              type: 'string',
              description: 'The medusa line item ID',
              example: 'cali_01M6GHP27VFW7096R5AQ0G5EHT',
            },
            variantId: {
              type: 'string',
              description: 'The medusa product variant ID',
              example: 'variant_01M6E4F0KWV67V7JV3TN7DMAM7',
            },
            title: { type: 'string', description: 'Product title', example: 'Mars Bar' },
            quantity: { type: 'integer', description: 'Quantity in cart', example: 3 },
            unitPrice: { type: 'integer', description: 'Price per item', example: 85 },
            lineTotal: { type: 'integer', description: 'Overall item price', example: 255 },
          },
        },
        AddLineItemsRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              $ref: '#/components/schemas/AddLineItemsRequestMetadata',
            },
          },
        },
        AddLineItemsRequestMetadata: {
          type: 'object',
          required: ['prisonId', 'offenderNo', 'productVariantId'],
          properties: {
            prisonId: { type: 'string', description: 'The prison identifier', example: 'MDI' },
            offenderNo: { type: 'string', description: "The prisoner's offender number", example: 'A1234BC' },
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W' },
            productVariantId: {
              type: 'string',
              description: 'The variant Id of the product to add to cart',
              example: 'var_1234',
            },
          },
        },
        AddLineItemsResponse: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W' },
          },
        },
        RemoveLineItemsRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              $ref: '#/components/schemas/RemoveLineItemsRequestMetadata',
            },
          },
        },
        RemoveLineItemsRequestMetadata: {
          type: 'object',
          required: ['cartId', 'lineItemId', 'quantity'],
          properties: {
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W' },
            lineItemId: {
              type: 'string',
              description: 'The ID of the line item to remove from the cart',
              example: 'var_1234',
            },
            quantity: {
              type: 'string',
              description: 'The new quantity of the line item, when quantity hits 0, delete item from basket',
              example: 'var_1234',
            },
          },
        },
        RemoveLineItemsResponse: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W' },
          },
        },
        RemoveBasketRequest: {
          type: 'object',
          required: ['metadata'],
          properties: {
            metadata: {
              $ref: '#/components/schemas/RemoveBasketMetadata',
            },
          },
        },
        RemoveBasketMetadata: {
          type: 'object',
          required: ['cartId'],
          properties: {
            cartId: { type: 'string', description: 'ID of medusa cart', example: 'cart_01M6EJSR29XNFFAFPVMJZPQZ2W' },
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
