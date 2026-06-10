import { Module } from '@medusajs/framework/utils'
import ProductModuleService from './service'

export const PRODUCT_MODULE = 'digitalCanteenProduct'

export default Module(PRODUCT_MODULE, {
  service: ProductModuleService,
})
