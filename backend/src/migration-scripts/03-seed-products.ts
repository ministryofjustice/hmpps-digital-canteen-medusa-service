import { ExecArgs } from "@medusajs/framework/types"
import {ContainerRegistrationKeys, Modules} from "@medusajs/framework/utils"

export default async function seedProducts({
                                               container,
                                           }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const productModuleService = container.resolve(
        Modules.PRODUCT
    )

    logger.info('Creating dummy products')

    await productModuleService.createProducts([
        {
            title: "1p Postage Stamp Sheet 25s",
            handle: "1p-postage-stamp-sheet-25s",
            status: "published",

            metadata: {
                ic_code: "182803",
            },

            options: [
                {
                    title: "Size",
                    values: ["Default"],
                },
            ],

            variants: [
                {
                    title: "Default",
                    options: {
                        Size: "Default",
                    },
                },
            ],
        },

        {
            title: "Coffee",
            handle: "coffee",
            status: "published",

            metadata: {
                ic_code: "182801",
            },

            options: [
                {
                    title: "Size",
                    values: ["Default"],
                },
            ],

            variants: [
                {
                    title: "Default",
                    options: {
                        Size: "Default",
                    },
                },
            ],
        },
        {
            title: "Biscuits",
            handle: "biscuits",
            status: "published",

            metadata: {
                ic_code: "182802",
            },

            options: [
                {
                    title: "Size",
                    values: ["Default"],
                },
            ],

            variants: [
                {
                    title: "Default",
                    options: {
                        Size: "Default",
                    },
                },
            ],
        }
    ])

    logger.info('Products created successfully')
}