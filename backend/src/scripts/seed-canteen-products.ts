import { ExecArgs } from "@medusajs/framework/types"
import { PRODUCT_MODULE } from "../modules/products"
import ProductModuleService from "../modules/products/service"

export default async function seedCanteenProducts({ container }: ExecArgs) {
  const productModuleService: ProductModuleService = container.resolve(
    PRODUCT_MODULE
  )

  const productsData = [
    {
      title: "Cheese Sandwich",
      description: "Classic cheese sandwich with cheddar",
      price: 350,
      inventory: 50,
      available: true,
    },
    {
      title: "Chicken Wrap",
      description: "Grilled chicken wrap with salad",
      price: 450,
      inventory: 30,
      available: true,
    },
    {
      title: "Apple Juice",
      description: "Freshly squeezed apple juice",
      price: 200,
      inventory: 100,
      available: true,
    },
    {
      title: "Chocolate Brownie",
      description: "Rich chocolate brownie",
      price: 250,
      inventory: 40,
      available: true,
    },
    {
      title: "Vegetable Soup",
      description: "Hearty vegetable soup",
      price: 300,
      inventory: 20,
      available: true,
    },
  ]

  console.log("Seeding canteen products...")

  try {
    const products = await productModuleService.createCanteenProducts(productsData)
    console.log(`Successfully seeded ${products.length} products.`)
  } catch (error) {
    console.error("Error seeding canteen products:", error)
  }
}
