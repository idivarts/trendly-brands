import { ContractStatus } from "@/shared-libs/firestore/trendly-pro/models/contracts";

export const CHAT_MESSAGE_TOPBAR_DESCRIPTION: Partial<Record<ContractStatus, string>> = {
    [ContractStatus.Pending]:
        "Use this chat to align with the influencer. Once ready, proceed to fund the contract.",
    [ContractStatus.ShipmentPending]:
        "Coordinate delivery details here. Once shipped, add the tracking info from the contract screen.",
    [ContractStatus.ReviewPending]:
        "The influencer has uploaded the deliverable. Review it and approve or request revisions.",
    [ContractStatus.SettlementPending]:
        "The video is live! Submit your feedback to close the contract and release the payout.",
};
