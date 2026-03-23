import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export type MarkShipmentDeliveredPayload = {
    contractId: string;
    screenshotUrl: string;
    notes?: string;
};

export async function markShipmentDelivered(
    payload: MarkShipmentDeliveredPayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/shipment/delivered`;
    const body = {
        screenshotUrl: payload.screenshotUrl,
        notes: payload.notes,
    };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to mark shipment as delivered");
    }
}

