import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export type MarkShipmentShippedPayload = {
    contractId: string;
    /**
     * Maps to backend `trackingId`
     */
    trackingId: string;
    /**
     * Maps to backend `shipmentProvider`
     */
    shipmentProvider: string;
    /**
     * Maps to backend `expectedDate` (ms since epoch)
     */
    expectedDate: number;
};

export async function markShipmentShipped(
    payload: MarkShipmentShippedPayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/shipment`;
    const body = {
        trackingId: payload.trackingId,
        shipmentProvider: payload.shipmentProvider,
        expectedDate: payload.expectedDate,
    };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to mark shipment as shipped");
    }
}

