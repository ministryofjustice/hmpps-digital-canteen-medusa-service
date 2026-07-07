import { addToCartWorkflow } from '@medusajs/medusa/core-flows';
import { ModuleRegistrationName, Modules } from "@medusajs/utils";
import { POST } from "../route";

// Mock workflow
jest.mock("@medusajs/medusa/core-flows", () => ({
    addToCartWorkflow: jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue(undefined),
    }),
}));

describe("POST handler - /store/pin-phone/carts/:id/add-items", () => {
    let req: any;
    let res: any;
    let productModuleService: any;
    let cartModuleService: any;

    beforeEach(() => {
        //Mock services
        productModuleService = {
            listProductVariants: jest.fn().mockResolvedValue([
                { id: "credit-variant-id" },
            ]),
        };

        cartModuleService = {
            retrieveCart: jest.fn().mockResolvedValue({
                id: "cart_123",
                items: [
                    {
                        id: "item_1",
                        variant_id: "credit-variant-id",
                        unit_price: 500,
                    },
                ],
            }),
        };

        // Mock container scope
        req = {
            params: { id: "cart_123" },
            body: { amount: 500 },
            scope: {
                resolve: jest.fn((key) => {
                    if (key === ModuleRegistrationName.PRODUCT) return productModuleService;
                    if (key === Modules.CART) return cartModuleService;
                    throw new Error(`Unexpected resolve key: ${key}`);
                }),
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it("adds CREDIT variant to cart and returns updated cart", async () => {
        await POST(req, res);

        // Product variant lookup
        expect(productModuleService.listProductVariants).toHaveBeenCalledWith({
            sku: "PIN-PHONE-CREDIT",
        });

        // Workflow call
        expect(addToCartWorkflow).toHaveBeenCalled();
        expect(addToCartWorkflow(req.scope).run).toHaveBeenCalledWith({
            input: {
                cart_id: "cart_123",
                items: [
                    {
                        variant_id: "credit-variant-id",
                        quantity: 1,
                        unit_price: 500,
                        requires_shipping: false,
                    },
                ],
            },
        });

        // Cart retrieval
        expect(cartModuleService.retrieveCart).toHaveBeenCalledWith("cart_123", {
            relations: ["items"],
        });

        // Response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            cart: {
                id: "cart_123",
                items: [
                    {
                        id: "item_1",
                        variant_id: "credit-variant-id",
                        unit_price: 500,
                    },
                ],
            },
        });
    });

    it("returns 404 if CREDIT variant is missing", async () => {
        productModuleService.listProductVariants.mockResolvedValue([]);

        await POST(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "CREDIT variant not found",
        });
    });

    it("returns 500 on unexpected error", async () => {
        productModuleService.listProductVariants.mockRejectedValue(
            new Error("DB failure")
        );

        await POST(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Failed to add credit item to cart",
            error: "DB failure",
        });
    });
});
