import { MedusaContainer } from "@medusajs/framework/types"
import { ScheduledJobContext } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import cleanupOrphanCarts from "../cleanup-orphan-carts"

describe("cleanupOrphanCarts job", () => {
    let container: MedusaContainer
    let loggerMock: any
    let queryMock: any
    let cartModuleServiceMock: any

    beforeEach(() => {
        loggerMock = {
            info: jest.fn(),
            error: jest.fn(),
        }
        queryMock = {
            graph: jest.fn(),
        }
        cartModuleServiceMock = {
            deleteCarts: jest.fn(),
        }

        container = {
            resolve: jest.fn((key) => {
                if (key === ContainerRegistrationKeys.LOGGER) return loggerMock
                if (key === ContainerRegistrationKeys.QUERY) return queryMock
                if (key === Modules.CART) return cartModuleServiceMock
                return null
            }),
        } as unknown as MedusaContainer
    })

    it("should delete orphan carts that match the criteria", async () => {
        const carts = [{ id: "cart_1" }, { id: "cart_2" }]
        queryMock.graph.mockResolvedValueOnce({ data: carts })

        await cleanupOrphanCarts(container, {} as ScheduledJobContext)

        expect(queryMock.graph).toHaveBeenCalledWith(
            expect.objectContaining({
                entity: Modules.CART,
                fields: ["id",
                         "completed_at",
                         "deleted_at",
                         "created_at",
                         "order.id"],
                filters: expect.objectContaining({
                    completed_at: null,
                    deleted_at: null,
                    created_at: expect.objectContaining({
                        $lt: expect.any(Date),
                    }),
                }),
            })
        )

        expect(cartModuleServiceMock.deleteCarts).toHaveBeenCalledWith(["cart_1", "cart_2"])
        expect(loggerMock.info).toHaveBeenCalledWith("Deleting 2 orphan carts: cart_1, cart_2")
    })

    it("should not delete anything if no orphan carts are found", async () => {
        queryMock.graph.mockResolvedValueOnce({ data: [] })

        await cleanupOrphanCarts(container, {} as ScheduledJobContext)

        expect(cartModuleServiceMock.deleteCarts).not.toHaveBeenCalled()
        expect(loggerMock.info).toHaveBeenCalledWith("No orphan carts found to delete.")
    })

    it("should log an error if something fails", async () => {
        const error = new Error("Query failed")
        queryMock.graph.mockRejectedValueOnce(error)

        await cleanupOrphanCarts(container, {} as ScheduledJobContext)

        expect(loggerMock.error).toHaveBeenCalledWith(
            "Error in cleanupOrphanCarts job: Query failed",
            error
        )
    })
})
