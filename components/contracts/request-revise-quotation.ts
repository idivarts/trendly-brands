import type { IContracts } from "@/shared-libs/firestore/trendly-pro/models/contracts";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { reviseQuotation } from "./api/payment-pending.api";

/** Brand-side "Ask to Revise Quote" — not tied to a modal; used from contract action buttons. */
export async function requestReviseQuotationForContract(
    contract: Pick<IContracts, "collaborationId" | "userId">
): Promise<void> {
    const collabId = contract.collaborationId;
    const influencerUserId = contract.userId;
    if (!collabId || !influencerUserId) {
        throw new Error("Missing collaborationId or userId for revise request");
    }

    await reviseQuotation({ collabId, userId: influencerUserId });
    Toaster.success("Revision request sent");
}

export function showReviseQuotationError(e: unknown): void {
    const message = e instanceof Error ? e.message : "Unable to request revision";
    Toaster.error(message);
}
