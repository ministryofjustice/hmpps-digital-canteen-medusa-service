import {
    defineMiddlewares,
    validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostAdminCreateBrand } from "./store/brands/validators"

export default defineMiddlewares({
    routes: [
        {
            matcher: "/store/brands",
            method: "POST",
            middlewares: [
                validateAndTransformBody(PostAdminCreateBrand),
            ],
        },
    ],
})