/**
 * Upload a file from inside the studio, and file it in the media library.
 *
 * ── Why this is not the shared AWS upload context ───────────────────────────
 * That context knows nothing about brands, because it is shared with the
 * influencer app where there is no brand to file against. The studio DOES have
 * one, and passing it is what turns an upload into a library row — which is the
 * whole point of the media collection.
 *
 * ── The three steps, and why there are three ────────────────────────────────
 *  1. PRESIGN with the brand id. The backend files a `pending` row and returns
 *     its media id along with the upload URL. This is the only moment the
 *     backend is involved, because the bytes then go from the device straight
 *     to S3 — so a row not filed here is a row never filed at all.
 *  2. PUT the bytes.
 *  3. CONFIRM, which HEADs the object and promotes the row. The SIZE comes from
 *     S3 rather than from here, deliberately: it is meant to be billable, and a
 *     number this client reports is a number this client could understate.
 *
 * A failed confirm leaves a pending row that a sweep marks failed, so the worst
 * case is a row the picker does not offer — never a file in the bucket that
 * nothing knows about.
 */
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { pickMedia } from "@/shared-libs/utils/media-picker";
import { useCallback, useState } from "react";

export interface UploadedMedia {
    mediaId: string;
    url: string;
    kind: "image" | "video";
    width?: number;
    height?: number;
}

export interface UseStudioUploadResult {
    uploading: boolean;
    /** 0..1 while a PUT is in flight. */
    progress: number;
    error: string | null;
    /** Pick a file and upload it. Resolves null when the user cancels. */
    pickAndUpload: (kind: "image" | "video" | "all") => Promise<UploadedMedia | null>;
}

export function useStudioUpload(
    brandId: string | undefined,
    contentId: string | undefined
): UseStudioUploadResult {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const pickAndUpload = useCallback(
        async (kind: "image" | "video" | "all"): Promise<UploadedMedia | null> => {
            if (!brandId) {
                setError("Pick a brand first.");
                return null;
            }
            const picked = await pickMedia(kind);
            if (!picked) return null;

            setUploading(true);
            setProgress(0);
            setError(null);

            try {
                const isVideo = picked.type === "video";
                const endpoint = isVideo ? "videos" : "images";
                const filename = `studio-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
                const query = new URLSearchParams({
                    filename,
                    brandId,
                    ...(contentId ? { contentId } : {}),
                });

                const presignRes = await HttpWrapper.fetch(
                    `/s3/v1/${endpoint}?${query.toString()}`,
                    { method: "POST" }
                );
                const presign = (await presignRes.json()) as {
                    uploadUrl: string;
                    imageUrl?: string;
                    playUrl?: string;
                    mediaId?: string;
                };
                const uploadUrl = presign.uploadUrl;
                const url = presign.imageUrl || presign.playUrl || "";
                if (!uploadUrl) throw new Error("no upload url");

                const blob = await (await fetch(picked.uri)).blob();
                await put(uploadUrl, blob, setProgress);

                if (presign.mediaId) {
                    // Dimensions are the one thing this side is trusted with:
                    // it has the decoded file and S3 cannot say how long a
                    // video is or how wide a photo is.
                    await HttpWrapper.fetch(
                        `/api/v2/brands/${brandId}/media/${presign.mediaId}/confirm`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                width: picked.width,
                                height: picked.height,
                            }),
                        }
                    );
                }

                return {
                    mediaId: presign.mediaId ?? "",
                    url,
                    kind: isVideo ? "video" : "image",
                    width: picked.width,
                    height: picked.height,
                };
            } catch {
                setError("That upload didn't finish. Please try again.");
                return null;
            } finally {
                setUploading(false);
                setProgress(0);
            }
        },
        [brandId, contentId]
    );

    return { uploading, progress, error, pickAndUpload };
}

/**
 * PUT with progress.
 *
 * XMLHttpRequest rather than fetch, because fetch has no upload progress event
 * and a 40MB clip uploading with no indication of movement reads as a hang.
 */
function put(url: string, blob: Blob, onProgress: (p: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
        xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`upload failed with ${xhr.status}`));
        xhr.onerror = () => reject(new Error("upload failed"));
        xhr.send(blob);
    });
}
