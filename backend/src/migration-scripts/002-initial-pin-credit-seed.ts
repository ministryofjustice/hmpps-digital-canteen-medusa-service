import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, ModuleRegistrationName, Modules } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'

/**
 * Pin Phone Credit seed migration.
 *
 * Pin credit is a national product, single Region
 *
 */
export default async function pin_credit_seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT)
  const storeModuleService = container.resolve(Modules.STORE)

  const countries = ['gb']

  logger.info('Seeding pin phone credit data')

  // Creates single  region covering the whole of the UK.
  /* TODO pp_system_default is built in default provider, to be replaced with pin phone credit payment provider */
  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'Pin Phone Credit - United Kingdom',
          currency_code: 'gbp',
          countries,
          payment_providers: ['pp_system_default'],
        },
      ],
    },
  })

  // Creates the sales channel
  const {
    result: [digitalSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: 'Pin Phone Credit Sales Channel',
          description: 'Sales channel for pin phone credit products',
        },
      ],
    },
  })

  // Creates a publishable API key and links it to the sales channel.
  const {
    result: [publishablePinCreditApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: 'Pin Phone Credit Publishable API Key',
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

  // Sets the store's default sales channel.
  // This may change later on, but for now pin credit is only sales channel
  const [store] = await storeModuleService.listStores()
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: digitalSalesChannel.id },
    },
  })

  // Creates a stock location representing where inventory is held.
  // Digital products still require a stock location by Medusa.
  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: 'Pin Phone Credit Digital Warehouse',
          address: {
            city: 'United Kingdom',
            country_code: 'GB',
            address_1: '',
          },
        },
      ],
    },
  })

  // Links the fulfillment provider to the stock location.
  // Digital products still require a fulfillment provider.
  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: 'manual_manual',
    },
  })

  // Links the sales channel to the stock location.
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [digitalSalesChannel.id],
    },
  })

  // Creates a shipping profile for digital products.
  // Digital products still require a shipping profile provider.
  const {
    result: [digitalShippingProfile],
  } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: 'Pin Phone Credit Digital Delivery',
          type: 'default',
        },
      ],
    },
  })

  // Creates a fulfillment set.
  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: 'Pin Phone Credit Digital fulfilment',
    type: 'shipping',
    service_zones: [
      {
        name: 'United Kingdom',
        geo_zones: countries.map(country_code => ({
          country_code,
          type: 'country' as const,
        })),
      },
    ],
  })

  // Links the fulfillment set to the stock location
  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  // Creates a shipping option for instant digital delivery at £0.
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Pin Phone Credit Instant Digital Delivery',
        price_type: 'flat',
        provider_id: 'manual_manual',
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: digitalShippingProfile.id,
        type: {
          label: 'Pin Phone Credit Digital',
          description: 'Instant delivery',
          code: 'pin-credit-digital',
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

  logger.info('Pin phone credit seed complete')
}
