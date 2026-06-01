import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {addToCartWorkflow,} from "@medusajs/medusa/core-flows";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params;
    const { amount } = req.body as {
        amount: number;
    };

    const { result } = await addToCartWorkflow(req.scope).run({
        input: {
            cart_id: id,
            items: [
                {
                    variant_id: "variant_01KT1WH9CXVD0CS4208GWSNS3P",
                    quantity: 1,
                    unit_price: amount,
                    requires_shipping: false,
                },
            ],
        },
    });

    res.status(200).json({ cart: result });
};