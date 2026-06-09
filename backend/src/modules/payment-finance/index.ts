import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import HmppsFinanceProviderService from './service'

export default ModuleProvider(Modules.PAYMENT, {
  services: [HmppsFinanceProviderService],
})
