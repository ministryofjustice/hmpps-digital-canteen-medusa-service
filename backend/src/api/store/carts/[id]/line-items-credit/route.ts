import {container, MedusaRequest, MedusaResponse} from "@medusajs/framework";
import {addToCartWorkflow,} from "@medusajs/medusa/core-flows";
import {ModuleRegistrationName} from "@medusajs/framework/utils";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params;
    const { amount } = req.body as {
        amount: number;
    };

    const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT);
    const [variant] = await productModuleService.listProductVariants({sku: "PIN-CREDIT",});

    const { result } = await addToCartWorkflow(req.scope).run({
        input: {
            cart_id: id,
            items: [
                {
                    variant_id: variant.id,
                    quantity: 1,
                    unit_price: amount,
                    requires_shipping: false,
                },
            ],
        },
    });

    res.status(200).json({ cart: result });
};