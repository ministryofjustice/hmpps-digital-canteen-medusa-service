import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createStoresWorkflow, createTaxRegionsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Initial seed.
 *
 * Only contains entities that are store-wide / shared across every
 * sales channel
 *
 *
 */
export default async function initial_data_seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const countries = ['gb']

  logger.info('Seeding store wide data')

  const storeModule = container.resolve(Modules.STORE)
  const existingStores = await storeModule.listStores()
  // Creates the store, which is the top-level entity in Medusa.
  if (existingStores.length === 0) {
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
          },
        ],
      },
    })
    logger.info('Store created')
  } else {
    logger.info('Store already exists — skipping')
  }

  // Creates tax regions for each country.
  // Before creating tax regions, check if they exist
  const taxModule = container.resolve(Modules.TAX)
  const existingTaxRegions = await taxModule.listTaxRegions({ country_code: 'gb' })
  if (existingTaxRegions.length === 0) {
    await createTaxRegionsWorkflow(container).run({
      input: countries.map(country_code => ({
        country_code,
        provider_id: 'tp_system',
      })),
    })
    logger.info('Tax regions created')
  } else {
    logger.info('Tax regions already exist — skipping')
  }

  logger.info('Store wide seed complete')
}
