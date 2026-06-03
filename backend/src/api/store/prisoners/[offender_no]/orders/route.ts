import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRISONER_MODULE } from "../../../../../modules/prisoner";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const { offender_no } = req.params;
    const prisonerService = req.scope.resolve(PRISONER_MODULE);
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const [prisoner] = await prisonerService.listPrisoners({
        prisoner_id: offender_no,
    });

    if (!prisoner) {
        return res.status(404).json({ message: "Prisoner not found" });
    }

    const { data: [linked] } = await query.graph({
        entity: "prisoner",
        fields: ["customer.*"],
        filters: { id: prisoner.id },
    });

    if (!linked?.customer) {
        return res.status(404).json({ message: "No customer linked" });
    }

    const { data: orders } = await query.graph({
        entity: "order",
        fields: [
            "id",
            "status",
            "created_at",
            "items.id",
            "items.title",
            "items.raw_unit_price",
        ],
        filters: { customer_id: linked.customer.id },
        pagination: {
            take: 500,
            order: { created_at: "DESC" },
        },
    });

    res.status(200).json({ orders });
}