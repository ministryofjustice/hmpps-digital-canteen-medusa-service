import { model } from "@medusajs/framework/utils"

const CanteenProduct = model.define("canteen_product", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  price: model.number(),
  inventory: model.number(),
  available: model.boolean().default(true),
})

export default CanteenProduct
