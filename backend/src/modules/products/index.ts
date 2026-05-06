import ProductModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PRODUCT_MODULE = "digitalCanteenProduct"

export default Module(PRODUCT_MODULE, {
  service: ProductModuleService,
})
