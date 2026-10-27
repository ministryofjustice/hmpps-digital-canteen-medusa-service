import { ExecArgs } from "@medusajs/framework/types"
import { createRegionsWorkflow } from "@medusajs/medusa/core-flows"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils";

export default async function seedPrisonRegions({
                                              container,
                                          }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const countries = ['gb']
    logger.info('Seeding prison regions')
    const { result } = await createRegionsWorkflow(container).run({
        input: {
            regions: [
                {
                    name: "HMP Erlestoke",
                    currency_code: "gbp",
                    //payment_providers: ['hmpps_payment']
                },
                {
                    name: "HMP Ashford ",
                    currency_code: "gbp",
                    //payment_providers: ['hmpps_payment']
                },
                {
                    name: "HMP Cookham Wood",
                    currency_code: "gbp",
                    //payment_providers: ['hmpps_payment']
                },
            ],
        },
    })

    logger.info('Region add completes')
}