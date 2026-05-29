// src/api/store/carts/route.ts
import {container, MedusaRequest, MedusaResponse} from "@medusajs/framework";
import { createCartWorkflow } from "@medusajs/medusa/core-flows";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRISONER_MODULE } from "../../../modules/prisoner";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
    const { region_id, metadata } = req.body as {
        region_id: string;
        metadata: {
            prison_id: string;
            offender_no: string;
        }
    };
    const { prison_id, offender_no } = metadata;

    const prisonerService = container.resolve(PRISONER_MODULE);
    const customerService = container.resolve(Modules.CUSTOMER);
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const [existingPrisoner] = await prisonerService.listPrisoners({
        prison_id,
        prisoner_id: offender_no,
    });
    console.log('TEST 1 ', existingPrisoner)

    let customerId: string | undefined;

    if (existingPrisoner) {
        console.log("PRISONER ALREADY EXISTS")
        // Find linked customer
        const { data: [linked] } = await query.graph({
            entity: "prisoner",
            fields: ["customer.*"],
            filters: { id: existingPrisoner.id },
        });
        customerId = linked?.customer?.id;
    } else {
        console.log("PRISONER DOES NOT ALREADY EXISTS")
        console.log(region_id, prison_id, offender_no)

        // Create customer
        const customer = await customerService.createCustomers({
            first_name: offender_no,
            last_name: prison_id,
            email: `${offender_no}@${prison_id}.internal.hmpps`,
        });

        // Create prisoner record
        const prisoner = await prisonerService.createPrisoners({
            prison_id,
            prisoner_id: offender_no,
        });

        // Link them
        await link.create({
            [Modules.CUSTOMER]: { customer_id: customer.id },
            [PRISONER_MODULE]: { prisoner_id: prisoner.id },
        });

        customerId = customer.id;
    }

    // Create cart with customer attached
    const { result } = await createCartWorkflow(req.scope).run({
        input: {
            region_id,
            customer_id: customerId,
        },
    });

    res.status(200).json({ cart: result });
};