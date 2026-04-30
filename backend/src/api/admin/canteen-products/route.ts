import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PRODUCT_MODULE } from "../../../modules/products";
import ProductModuleService from "../../../modules/products/service";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productModuleService: ProductModuleService = req.scope.resolve(
    PRODUCT_MODULE
  );

  try {
    const products = await productModuleService.listCanteenProducts();

    res.json({
      products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching canteen products",
      error: error.message
    });
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productModuleService: ProductModuleService = req.scope.resolve(
    PRODUCT_MODULE
  );

  try {
    const product = await productModuleService.createCanteenProducts(req.body as any);

    res.json({
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating canteen product",
      error: error.message
    });
  }
}
