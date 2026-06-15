import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, ModuleRegistrationName, Modules } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from '@medusajs/medusa/core-flows'

export default async function initial_data_seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT)

  const countries = ['gb']

  // Creates the sales channel through which products are sold.
  logger.info('Seeding store data')

  const {
    result: [digitalSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: 'Digital Sales Channel',
          description: 'Sales channel for digital products',
        },
      ],
    },
  })

  // Creates a publishable API key and links it to the sales channel.
  // Publishable API key can scope requests to sales channels, when we have multiple
  const {
    result: [publishablePinCreditApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: 'Pin Credit Publishable API Key',
          type: 'publishable',
          created_by: '',
        },
      ],
    },
  })

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishablePinCreditApiKey.id,
      add: [digitalSalesChannel.id],
    },
  })

  // Creates the store, which is the top-level entity in Medusa.
  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: 'Digital Canteen Store',
          supported_currencies: [
            {
              currency_code: 'gbp',
              is_default: true,
            },
          ],
          default_sales_channel_id: digitalSalesChannel.id,
        },
      ],
    },
  })

  // Creates a region representing the UK.
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'United Kingdom',
          currency_code: 'gbp',
          countries,
          // pp_system_default is Medusa's built-in placeholder payment provider, to be replaced with a real BT payment provider
          payment_providers: ['pp_system_default'],
        },
      ],
    },
  })
  const region = regionResult[0]

  // Creates tax regions for each country.
  // tp_system is Medusa's built-in tax provider.
  await createTaxRegionsWorkflow(container).run({
    input: countries.map(country_code => ({
      country_code,
      provider_id: 'tp_system',
    })),
  })

  // Creates a stock location representing where inventory is held.
  // Even for digital products a stock location is required by Medusa
  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: 'Digital Warehouse',
          address: {
            city: 'Belfast',
            country_code: 'GB',
            address_1: '',
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  // Links the fulfillment provider to the stock location.
  // manual_manual is Medusa's built-in fulfillment provider.
  // To be replaced with a real  fulfillment provider when we have one.
  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: 'manual_manual',
    },
  })

  // Links the sales channel to the stock location so that products
  // sold through the Digital Sales Channel are fulfilled from the Digital Warehouse.
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [digitalSalesChannel.id],
    },
  })

  // Creates a shipping profile for digital products.
  const { result: digitalShippingProfileResult } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: 'Digital Delivery',
          type: 'default',
        },
      ],
    },
  })
  const digitalShippingProfile = digitalShippingProfileResult[0]

  // Creates a fulfillment set with a service zone covering the UK.
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: 'Digital fulfilment',
    type: 'shipping',
    service_zones: [
      {
        name: 'United Kingdom',
        geo_zones: [
          {
            country_code: 'gb',
            type: 'country',
          },
        ],
      },
    ],
  })

  // Links the fulfillment set to the stock location so Medusa knows
  // which fulfillment set handles orders from the Digital Warehouse.
  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  // Creates a shipping option for instant digital delivery at £0.
  // Digital products have no shipping cost
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Instant Digital Delivery',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: digitalShippingProfile.id,
        type: {
          label: 'Digital',
          description: 'Instant delivery',
          code: 'digital',
        },
        prices: [
          {
            currency_code: 'gbp',
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: 'enabled_in_store',
            value: 'true',
            operator: 'eq',
          },
          {
            attribute: 'is_return',
            value: 'false',
            operator: 'eq',
          },
        ],
      },
    ],
  })
}
