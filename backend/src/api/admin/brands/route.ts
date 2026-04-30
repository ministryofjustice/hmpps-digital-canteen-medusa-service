import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import {
    createBrandWorkflow,
} from "../../../workflows/create-brand"
import { PostAdminCreateBrand } from "./validators"
import { z } from "@medusajs/framework/zod"
import BrandModuleService from "../../../modules/brand/service";
import {BRAND_MODULE} from "../../../modules/brand";

type PostAdminCreateBrandType = z.infer<typeof PostAdminCreateBrand>

export const POST = async (
    req: MedusaRequest<PostAdminCreateBrandType>,
    res: MedusaResponse
) => {
    const { result } = await createBrandWorkflow(req.scope)
        .run({
            input: req.validatedBody,
        })

    res.json({
        brand: result
    })
}

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const brandModuleService: BrandModuleService = req.scope.resolve(
        BRAND_MODULE
    );

    try {
        const brand = await brandModuleService.listBrands()

        res.json({
            message: "Available Brands",
            data: brand,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching brands",
            error: error.message
        });
    }
}

export async function DELETE(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const brandModuleService: BrandModuleService = req.scope.resolve(
        BRAND_MODULE
    );

    try {
        const brandId = req.query.id as string;
        console.log("BrandId:", brandId)
        const brand = await brandModuleService.deleteBrands(brandId)

        res.json({
            message: "Brands deleted successfully",
            data: brand,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching brands",
            error: error.message
        });
    }
}
