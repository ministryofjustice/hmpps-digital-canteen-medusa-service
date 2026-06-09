import { z } from '@medusajs/framework/zod'

export const PostStoreCreateBrand = z.object({
  name: z.string(),
})
