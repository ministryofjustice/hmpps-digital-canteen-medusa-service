import { defineMiddlewares } from "@medusajs/framework/http"
import { validateHmppsToken} from "./validateHmppsToken"

export default defineMiddlewares({
    routes: [
        { matcher: "/internal/*", middlewares: [validateHmppsToken] },
    ],
})