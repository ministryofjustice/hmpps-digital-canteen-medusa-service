import {MedusaRequest, MedusaResponse} from "@medusajs/framework";
import {addToCartWorkflow, createPaymentCollectionForCartWorkflow} from "@medusajs/medusa/core-flows";
import {ModuleRegistrationName, Modules} from "@medusajs/framework/utils";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params;
    const { amount } = req.body as {
        amount: number;
    };

    const productModuleService = req.scope.resolve(ModuleRegistrationName.PRODUCT);
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

    const paymentCollection =
        await createPaymentCollectionForCartWorkflow(req.scope)
            .run({
                input: {
                    cart_id: id,
                },
            });

    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);
    await paymentModuleService.createPaymentSession(paymentCollection.result.id, {
        provider_id: "pp_bt-payment_bt-payment",
        amount,
        currency_code: "gbp",
        data: {},
    });

    res.status(200).json({ cart: result });
};