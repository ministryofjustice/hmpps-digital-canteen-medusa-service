import {Modules } from "@medusajs/framework/utils"
import {ExecArgs, IProductModuleService} from "@medusajs/framework/types"

export default async function seedCanteenProducts({ container }: ExecArgs) {
  const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
  )

  const productsData = [
    {
      title: "Cheese Sandwich3",
      description: "Classic cheese sandwich with cheddar",
      variants: [
        {
          title: "Default",
          prices: [
            {
              amount: 350,
              currency_code: "gbp", // or your currency
            },
          ],
          manage_inventory: true,
          inventory_quantity: 50,
        },
      ],
      images: [
        {
          url: "https://www.allrecipes.com/thmb/H_gwkwI6-5YPvZhXxYyf2TS5vbs=/0x512/filters:no_upscale():max_bytes(150000):strip_icc()/AR-238891-Grilled-Cheese-Sandwich-beauty-4x3-362f705972e64a948b7ec547f7b2a831.jpg",
        }
    ],
    },
    // ... other products
  ]

  console.log("Seeding canteen products...")

  try {
    for (const productData of productsData) {
      await productModuleService.upsertProducts(productData)
    }
    console.log(`Successfully seeded ${productsData.length} products.`)
  } catch (error) {
    console.error("Error seeding canteen products:", error)
  }
}