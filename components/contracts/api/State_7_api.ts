import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";

export type ChangeReleaseDatePayload = {
    contractId: string;
    newScheduledDate: number;
};

export async function changeReleaseDate(
    payload: ChangeReleaseDatePayload
): Promise<void> {
    const urlPath = `/monetize/brands/contracts/${payload.contractId}/posting/reschedule`;
    const body = { newScheduledDate: payload.newScheduledDate };

    try {
        await HttpWrapper.fetch(urlPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        const message = await HttpWrapper.extractErrorMessage(err);
        throw new Error(message ?? "Failed to update release date");
    }
}

