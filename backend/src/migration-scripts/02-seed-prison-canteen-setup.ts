/* eslint-disable no-await-in-loop */
import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createApiKeysWorkflow, linkSalesChannelsToApiKeyWorkflow } from '@medusajs/core-flows'
import { createRegionsWorkflow } from '@medusajs/medusa/core-flows'
import { prisons } from '../config/prisons'

export default async function seedPrisonCanteenSetup({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  const existingRegions = await container.resolve(Modules.REGION).listRegions()

  const existingChannels = await container.resolve(Modules.SALES_CHANNEL).listSalesChannels()

  for (const prison of prisons) {
    /**
     * Create Region
     */

    const region = existingRegions.find(existingRegion => existingRegion.metadata?.prison_code === prison.code)

    if (!region) {
      await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: prison.name,
              currency_code: 'gbp',
              metadata: {
                prison_code: prison.code,
              },
            },
          ],
        },
      })

      logger.info(`Created region for ${prison.code}`)
    }

    /**
     * Create Sales Channel
     */
    let salesChannel = existingChannels.find(sc => sc.name === prison.code)

    if (!salesChannel) {
      const [createdChannel] = await salesChannelService.createSalesChannels([
        {
          name: prison.code,
          description: prison.name,
        },
      ])

      salesChannel = createdChannel

      logger.info(`Created sales channel ${prison.code}`)
    }

    /**
     * Create Publishable API Key
     */
    const {
      result: [apiKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: `${prison.code} Publishable API Key`,
            type: 'publishable',
            created_by: '',
          },
        ],
      },
    })

    /**
     * Link API Key to Sales Channel
     */
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: apiKey.id,
        add: [salesChannel.id],
      },
    })

    logger.info(`Created publishable key and linked to ${prison.code}`)
  }

  logger.info('Canteen inital setup completed')
}
