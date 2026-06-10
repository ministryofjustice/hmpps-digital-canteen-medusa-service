import { defineMiddlewares, validateAndTransformBody } from '@medusajs/framework/http'
import { PostStoreCreateBrand } from './store/brands/validators'
import { validateHmppsToken } from './hmppsAuth'

export default defineMiddlewares({
  routes: [
    {
      matcher: '/store/brands',
      method: 'POST',
      middlewares: [validateAndTransformBody(PostStoreCreateBrand)],
    },
    {
      matcher: '/store/*',
      middlewares: [validateHmppsToken],
    },
  ],
})
