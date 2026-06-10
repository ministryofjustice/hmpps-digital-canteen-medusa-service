import { MedusaService } from '@medusajs/framework/utils'
import CanteenProduct from './models/product'

class ProductModuleService extends MedusaService({
  CanteenProduct,
}) {}

export default ProductModuleService
