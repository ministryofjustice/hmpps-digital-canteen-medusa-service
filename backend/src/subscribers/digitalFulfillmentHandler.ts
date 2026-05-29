import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {ContainerRegistrationKeys, Modules} from "@medusajs/framework/utils";
import {
    capturePaymentWorkflow,
    completeOrderWorkflow,
    createOrderFulfillmentWorkflow
} from "@medusajs/medusa/core-flows";

export default async function digitalFulfillmentHandler({
                                                            event: { data },
                                                            container,
                                                        }: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const orderId = data.id;

    logger.info(`Processing digital order ${orderId}...`);

    // Retrieve order with items and payment info
    const { data: [order] } = await query.graph({
        entity: "order",
        fields: [
            "id",
            "items.*",
            "items.variant.*",
            "items.variant.product.*",
            "items.variant.product.type.*",
            "payment_collections.*",
            "payment_collections.payments.*",
        ],
        filters: { id: orderId },
    });

    if (!order?.items?.length) {
        logger.warn(`No items found for order ${orderId}`);
        return;
    }

    // Check if this order has digital items
    const digitalItems = order.items
        .filter((item): item is NonNullable<typeof item> => item != null)
        .filter((item) => item.variant?.product?.type?.value === "digital");

    if (!digitalItems?.length) {
        logger.info(`No digital items in order ${orderId}, skipping`);
        return;
    }

    // Step 1: Capture payment
    try {
        const paymentCollection = order.payment_collections?.[0];
        const payment = paymentCollection?.payments?.find(
            (p) => p?.captured_at === null
        );

        if (payment) {
            logger.info(`Capturing payment ${payment.id} for order ${orderId}`);

            await capturePaymentWorkflow(container).run({
                input: {
                    payment_id: payment.id,
                },
            });

            logger.info(`Payment captured for order ${orderId}`);
        } else {
            logger.info(`Payment already captured for order ${orderId}`);
        }
    } catch (error) {
        logger.error(
            `Failed to capture payment for order ${orderId}: ${error.message}`
        );
        return; // Don't fulfil if payment capture fails
    }

    // Step 2: Create fulfillment for digital items
    try {
        logger.info(
            `Auto-fulfilling ${digitalItems.length} digital item(s) for order ${orderId}`
        );

        await createOrderFulfillmentWorkflow(container).run({
            input: {
                order_id: orderId,
                items: digitalItems.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                })),
                no_notification: false,
            },
        });

        await completeOrderWorkflow(container).run({
            input: {
                orderIds: [orderId],
            },
        });

        logger.info(`Digital fulfilment complete for order ${orderId}`);

    } catch (error) {
        logger.error(
            `Failed to fulfil digital items for order ${orderId}: ${error.message}`
        );
    }
}

export const config: SubscriberConfig = {
    event: "order.placed",
};