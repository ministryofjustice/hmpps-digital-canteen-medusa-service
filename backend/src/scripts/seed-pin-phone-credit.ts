import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, ModuleRegistrationName, ProductStatus } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'

export default async function seedProducts({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT)

  // Look up references created by the migration
  const { data: salesChannels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'name'],
    filters: { name: 'Digital Sales Channel' },
  })
  const digitalSalesChannel = salesChannels[0]

  const { data: shippingProfiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id', 'name'],
    filters: { name: 'Digital Delivery' },
  })
  const digitalShippingProfile = shippingProfiles[0]

  let [digitalType] = await productModuleService.listProductTypes({ value: 'digital' })
  if (!digitalType) {
    ;[digitalType] = await productModuleService.createProductTypes([{ value: 'digital' }])
  }

  const [existing] = await productModuleService.listProducts({ handle: 'pin-phone-credit' })
  if (existing) {
    logger.info('Updating PIN phone credit product')
    await productModuleService.updateProducts(existing.id, {
      title: 'PIN Phone Credit',
      description: 'Top up your phone account with PIN credit',
      status: ProductStatus.PUBLISHED,
      thumbnail: 'https://placehold.co/400x400/1a1a2e/ffffff?text=PIN+Credit',
      images: [
        {
          url: 'https://placehold.co/400x400/1a1a2e/ffffff?text=PIN+Credit',
        },
      ],
    })
    logger.info('Updated PIN Phone Credit.')
    return
  }

  logger.info('Creating PIN Phone Credit')
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'PIN Phone Credit',
          description: 'Top up your phone account with PIN credit',
          handle: 'pin-phone-credit',
          status: ProductStatus.PUBLISHED,
          type_id: digitalType.id,
          shipping_profile_id: digitalShippingProfile.id,
          thumbnail: 'https://placehold.co/400x400/1a1a2e/ffffff?text=PIN+Credit',
          images: [
            {
              url: 'https://placehold.co/400x400/1a1a2e/ffffff?text=PIN+Credit',
            },
          ],
          options: [
            {
              title: 'Type',
              values: ['Digital'],
            },
          ],
          variants: [
            {
              title: 'PIN Phone Credit',
              sku: 'PIN-CREDIT',
              manage_inventory: false,
              prices: [{ amount: 0, currency_code: 'gbp' }],
            },
          ],
          sales_channels: [{ id: digitalSalesChannel.id }],
        },
      ],
    },
  })

  logger.info('Finished seeding PIN Phone Credit.')
}
