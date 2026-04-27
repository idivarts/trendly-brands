import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { ContractStatus } from "@/shared-constants/contract-status";
import { logContractApiCall } from "./logContractApiCall";

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
        logContractApiCall({
            apiState: "State_3_api",
            state: ContractStatus.ShipmentPending,
            action: "markShipmentShipped",
            contractId: payload.contractId,
        });
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

export type GetShipmentStatusPayload = {
    contractId: string;
};

/**
 * POST /monetize/brands/contracts/:contractId/shipment/get-status
 * Refreshes delivery / shipment status from the carrier (Delivery acknowledgement pending).
 */
export async function getShipmentStatus(
    payload: GetShipmentStatusPayload
): Promise<unknown> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/shipment/get-status`;

    try {
        logContractApiCall({
            apiState: "State_5_api",
            state: ContractStatus.DeliveryAcknowledgementPending,
            action: "getShipmentStatus",
            contractId: payload.contractId,
        });
        const res = await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        try {
            return await res.json();
        } catch {
            return null;
        }
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to get delivery status");
    }
}

