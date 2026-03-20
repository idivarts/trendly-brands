import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export type MarkShipmentDeliveredPayload = {
    contractId: string;
    proofOfDeliveryUrl: string;
    receivedNotes?: string;
};

export async function markShipmentDelivered(
    payload: MarkShipmentDeliveredPayload
): Promise<void> {
    // TODO: replace URL path with the backend endpoint for "mark shipment as delivered".
    const urlPath = `/api/collabs/contracts/${payload.contractId}/state-4/mark-delivered`;
    const body = {
        proofOfDeliveryUrl: payload.proofOfDeliveryUrl,
        receivedNotes: payload.receivedNotes,
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

