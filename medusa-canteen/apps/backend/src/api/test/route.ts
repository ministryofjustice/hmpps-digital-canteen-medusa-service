import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.json({
    message: "HMPPS Digital Canteen Test API",
    timestamp: new Date().toISOString(),
    status: "healthy",
    version: "1.0.0"
  });
}

