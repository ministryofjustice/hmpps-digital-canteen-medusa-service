# HMPPS Finance Payment Provider module

## Overview

1. **Authorization** - Funds are placed on hold  when order is created
2. **Capture** - Funds are transferred when order is fulfilled, clarification needed on this behaviour

## Files

    src/
    ├── clients/
    │   └── finance-client.ts          # HMPPS Finance API client
    ├── modules/
    │   └── payment-finance/
    │       ├── service.ts              # Payment provider implementation
    │       ├── types.ts                # TypeScript interfaces
    │       └── index.ts                # Module registration

### Payment Provider Methods

#### `initiatePayment(input: InitiatePaymentInput)`

**Triggered by:** `POST /store/payment-collections/{id}/payment-sessions`

**Purpose:** Initialize payment session with prisoner details and amount

**HMPPS API:** None

**Data Stored:**
- `prisonId` - Prison identifier
- `offenderNo` - Prisoner number
- `amount` - Payment amount in cents
- `clientTransactionId` - Unique transaction ID
- `clientUniqueReference` - Reference for tracking

---

#### `authorizePayment(input: AuthorizePaymentInput)`

**Triggered by:** `POST /store/carts/{id}/complete`

**Purpose:** Create hold on prisoner account

**HMPPS API:** `POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/add-hold`

**Request:**
```json
{
  "description": "HOLD",
  "amount": 2400,
  "clientTransactionId": "1234567890",
  "clientName": "Digital Canteen",
  "clientUniqueReference": "cart-123-1234567890"
}
```

**Result:**
- Hold created with `holdNumber`
- Funds reserved on prisoner account
- Order created with payment status `AUTHORIZED`

---

#### `capturePayment(input: CapturePaymentInput)`

**Status:** Not implemented (pending fulfillment module)

**Purpose:** Release hold and create transaction to complete payment

**Future Implementation:**
- Manual trigger via admin "Capture payment" button
- Automatic trigger via fulfillment subscriber (recommended)

**HMPPS API:** `POST /api/finance-holds/prison/{prisonId}/offenders/{offenderNo}/release-hold-transaction/{holdNumber}`

---

#### Other Methods that can/could be implemented
https://docs.medusajs.com/resources/references/payment/provider#understanding-payment-module-provider-implementation

     `updatePayment()` 
     `getPaymentStatus()` 
     `retrievePayment()`
     `deletePayment()`
     `cancelPayment()` 
     `refundPayment()` 
     `getWebhookActionAndData()` 

## API Flow (Postman Collection)

### Prerequisites

Set these collection variables in Postman:
- `base_url` - Medusa backend URL (e.g., `http://localhost:9000`)
- `region_id` - Medusa region ID
- `variant_id` - Product variant ID
- `shipping_option_id` - Shipping option ID
- `prison_id` - Prison identifier (e.g., `ASI`)
- `offender_no` - Prisoner number (e.g., `G9167UL`)

### Complete Checkout Flow

#### 1. Create Cart
```http
POST {{base_url}}/store/carts
Content-Type: application/json
```
---

#### 2. Add Items to Cart
```http
POST {{base_url}}/store/carts/{{cart_id}}/line-items
Content-Type: application/json
```
---

#### 3. Add Shipping Address
```http
POST {{base_url}}/store/carts/{{cart_id}}
Content-Type: application/json
```
---

#### 4. Add Shipping Method
```http
POST {{base_url}}/store/carts/{{cart_id}}
Content-Type: application/json
```
---

#### 5. Initialize Payment Collection
```http
POST {{base_url}}/store/payment-collections
Content-Type: application/json
```
---

#### 6. Create Payment Session
```http
POST {{base_url}}/store/payment-collections/{{payment_collection_id}}/payment-sessions
Content-Type: application/json
```
---

#### 7. Complete Cart (Creates Hold)
```http
POST {{base_url}}/store/carts/{{cart_id}}/complete
Content-Type: application/json
```
---


### Environment Variables

Required for HMPPS Finance API client:

```env
HMPPS_AUTH_URL=https://auth.hmpps.service.justice.gov.uk
HMPPS_FINANCE_API_URL=https://finance.hmpps.service.justice.gov.uk
HMPPS_CLIENT_ID=your-client-id
HMPPS_CLIENT_SECRET=your-client-secret
```

### Postman collection

    {
    "info": {
    "_postman_id": "261e0de5-6b4d-4018-aef4-eda5f63bbe8b",
    "name": "HMPPS Medusa Checkout Flow",
    "description": "Example payment flow",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_exporter_id": "19266082"
    },
    "item": [
    {
    "name": "Prerequisites",
    "item": [
    {
    "name": "Get Regions",
    "request": {
    "method": "GET",
    "header": [
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "url": {
    "raw": "{{base_url}}/store/regions",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "regions"
    ]
    }
    },
    "response": []
    },
    {
    "name": "Get Products",
    "request": {
    "method": "GET",
    "header": [
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "url": {
    "raw": "{{base_url}}/store/products",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "products"
    ]
    }
    },
    "response": []
    }
    ],
    "description": "Setup and prerequisite requests"
    },
    {
    "name": "1. Create Cart",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "pm.collectionVariables.set('cart_id', response.cart.id);",
    "console.log('✓ Cart ID:', response.cart.id);",
    "console.log('  Amount:', response.cart.total, response.cart.currency_code.toUpperCase());"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"region_id\": \"{{region_id}}\",\n  \"metadata\": {\n    \"prisonId\": \"{{prison_id}}\",\n    \"offenderNo\": \"{{offender_no}}\"\n  }\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/carts",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "carts"
    ]
    },
    "description": "Create a new cart with prisoner metadata"
    },
    "response": []
    },
    {
    "name": "2. Add Items to Cart",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "console.log('✓ Item added to cart');",
    "console.log('  Items:', response.cart.items.length);",
    "console.log('  Subtotal:', response.cart.subtotal, response.cart.currency_code.toUpperCase());"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"variant_id\": \"{{variant_id}}\",\n  \"quantity\": 1\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/carts/{{cart_id}}/line-items",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "carts",
    "{{cart_id}}",
    "line-items"
    ]
    },
    "description": "Add product variant to cart"
    },
    "response": []
    },
    {
    "name": "3. Add Shipping Address",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "console.log('✓ Shipping address added');"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"shipping_address\": {\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"address_1\": \"123 Prison St\",\n    \"city\": \"London\",\n    \"country_code\": \"gb\",\n    \"postal_code\": \"SW1A 1AA\"\n  }\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/carts/{{cart_id}}",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "carts",
    "{{cart_id}}"
    ]
    },
    "description": "Set shipping address for delivery"
    },
    "response": []
    },
    {
    "name": "4. Add Shipping Method",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "console.log('✓ Shipping method added');",
    "console.log('  Total with shipping:', response.cart.total, response.cart.currency_code.toUpperCase());"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"option_id\": \"{{shipping_option_id}}\"\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/carts/{{cart_id}}/shipping-methods",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "carts",
    "{{cart_id}}",
    "shipping-methods"
    ]
    },
    "description": "Select shipping method"
    },
    "response": []
    },
    {
    "name": "5. Initialize Payment Collection",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "pm.collectionVariables.set('payment_collection_id', response.payment_collection.id);",
    "console.log('✓ Payment Collection ID:', response.payment_collection.id);",
    "console.log('  Amount:', response.payment_collection.amount, response.payment_collection.currency_code.toUpperCase());"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"cart_id\": \"{{cart_id}}\"\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/payment-collections",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "payment-collections"
    ]
    },
    "description": "Initialize payment collection for the cart"
    },
    "response": []
    },
    {
    "name": "6. Create Payment Session",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "",
    "// Debug: Log the full response to see structure",
    "console.log('Payment Session Response:', JSON.stringify(response, null, 2));",
    "",
    "// Extract session ID",
    "if (response.payment_collection && response.payment_collection.payment_sessions) {",
    "    const sessions = response.payment_collection.payment_sessions;",
    "    ",
    "    if (sessions.length > 0) {",
    "        const sessionId = sessions[0].id;",
    "        pm.collectionVariables.set('session_id', sessionId);",
    "        console.log('✓ Session ID:', sessionId);",
    "        console.log('  Status:', sessions[0].status);",
    "        console.log('  Provider:', sessions[0].provider_id);",
    "        console.log('  Prison:', sessions[0].data.prisonId);",
    "        console.log('  Offender:', sessions[0].data.offenderNo);",
    "    } else {",
    "        console.error('No payment sessions found');",
    "    }",
    "} else {",
    "    console.error('Unexpected response structure');",
    "}"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{\n  \"provider_id\": \"pp_payment-finance_payment-finance\",\n  \"data\": {\n    \"prisonId\": \"{{prison_id}}\",\n    \"offenderNo\": \"{{offender_no}}\"\n  }\n}"
    },
    "url": {
    "raw": "{{base_url}}/store/payment-collections/{{payment_collection_id}}/payment-sessions",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "payment-collections",
    "{{payment_collection_id}}",
    "payment-sessions"
    ]
    },
    "description": "Create payment session with HMPPS Finance provider"
    },
    "response": []
    },
    {
    "name": "7. Complete Cart (Authorize + Create hold)",
    "event": [
    {
    "listen": "test",
    "script": {
    "exec": [
    "const response = pm.response.json();",
    "",
    "if (response.order) {",
    "    pm.collectionVariables.set('order_id', response.order.id);",
    "    console.log('ORDER CREATED SUCCESSFULLY!');",
    "    console.log('');",
    "    console.log('  Order Details:');",
    "    console.log('  Order ID:', response.order.id);",
    "    console.log('  Status:', response.order.status);",
    "    console.log('  Total:', response.order.total, response.order.currency_code.toUpperCase());",
    "    console.log('  Payment Status:', response.order.payment_status);",
    "    console.log('');",
    "    console.log('  Payment Flow:');",
    "    console.log('   Hold created on prisoner account');",
    "    console.log('  Hold active - waiting for fulfillment');",
    "    console.log('   Release hold when order is fulfilled/delivered');",
    "} else {",
    "    console.error('Order creation failed');",
    "    console.log('Response:', JSON.stringify(response, null, 2));",
    "}"
    ],
    "type": "text/javascript",
    "packages": {},
    "requests": {}
    }
    }
    ],
    "request": {
    "method": "POST",
    "header": [
    {
    "key": "Content-Type",
    "value": "application/json"
    },
    {
    "key": "x-publishable-api-key",
    "value": "{{publishable_key}}",
    "type": "text"
    }
    ],
    "body": {
    "mode": "raw",
    "raw": "{}"
    },
    "url": {
    "raw": "{{base_url}}/store/carts/{{cart_id}}/complete",
    "host": [
    "{{base_url}}"
    ],
    "path": [
    "store",
    "carts",
    "{{cart_id}}",
    "complete"
    ]
    },
    "description": "Complete cart - creates order and authorizes payment (creates hold on prisoner account)"
    },
    "response": []
    }
    ],
    "event": [
    {
    "listen": "prerequest",
    "script": {
    "type": "text/javascript",
    "packages": {},
    "requests": {},
    "exec": [
    ""
    ]
    }
    },
    {
    "listen": "test",
    "script": {
    "type": "text/javascript",
    "packages": {},
    "requests": {},
    "exec": [
    ""
    ]
    }
    }
    ],
    "variable": [
    {
    "key": "base_url",
    "value": "http://localhost:9000"
    },
    {
    "key": "region_id",
    "value": "reg_01EXAMPLE"
    },
    {
    "key": "variant_id",
    "value": "variant_01EXAMPLE"
    },
    {
    "key": "shipping_option_id",
    "value": "so_01EXAMPLE"
    },
    {
    "key": "prison_id",
    "value": "ASI"
    },
    {
    "key": "offender_no",
    "value": "G9167UL"
    },
    {
    "key": "cart_id",
    "value": ""
    },
    {
    "key": "payment_collection_id",
    "value": ""
    },
    {
    "key": "session_id",
    "value": ""
    },
    {
    "key": "order_id",
    "value": ""
    },
    {
    "key": "publishable_key",
    "value": ""
    }
    ]
    }
