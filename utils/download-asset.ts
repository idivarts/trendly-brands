import Toaster from "@/shared-uis/components/toaster/Toaster";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

/** Derive a sensible download filename from a URL, falling back to `fallback`. */
function filenameFromUrl(url: string, fallback: string): string {
    try {
        const clean = url.split("?")[0].split("#")[0];
        const last = clean.split("/").filter(Boolean).pop();
        if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return decodeURIComponent(last);
    } catch {
        /* ignore — use the fallback */
    }
    return fallback;
}

/**
 * Progress reporter for {@link downloadAsset}. Receives a fraction in [0, 1]
 * when the total size is known, or `null` when the download is in flight but the
 * size is unknown (show an indeterminate spinner in that case).
 */
export type DownloadProgress = (fraction: number | null) => void;

/**
 * Download a remote image/video to the viewer's device from the public share
 * view. Works on web and native without a media-library permission:
 *   web    → streams the response so the caller can show a live percentage
 *            (falls back to a plain blob / new tab when streaming or CORS fails),
 *            then triggers an `<a download>` click.
 *   native → download into the app cache then hand off to the OS share sheet so
 *            the viewer picks where to save (Photos / Files). Byte progress isn't
 *            exposed by the new expo-file-system API, so `onProgress(null)` marks
 *            it indeterminate.
 *
 * Mirrors the download pattern already used in
 * `components/contracts/InfluencerUploadedVideo.tsx`.
 */
export async function downloadAsset(
    url: string,
    suggestedName?: string,
    onProgress?: DownloadProgress
): Promise<void> {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const name = suggestedName ?? filenameFromUrl(trimmed, `trendly-asset-${Date.now()}`);

    if (Platform.OS === "web") {
        try {
            const res = await fetch(trimmed);
            if (!res.ok) throw new Error("bad status");

            const total = Number(res.headers.get("Content-Length")) || 0;
            let blob: Blob;

            // Stream the body when possible so we can report a real percentage;
            // Content-Length is a CORS-safelisted response header, so S3/CloudFront
            // GETs expose it.
            if (res.body && total > 0 && typeof res.body.getReader === "function") {
                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];
                let received = 0;
                onProgress?.(0);
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        received += value.length;
                        onProgress?.(Math.min(received / total, 1));
                    }
                }
                blob = new Blob(chunks as BlobPart[]);
            } else {
                // Unknown size — indeterminate.
                onProgress?.(null);
                blob = await res.blob();
            }

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = name;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
            // TEMP-EXPERIMENT: toast disabled to isolate a RNW warning
            // Toaster.success("Download started");
        } catch {
            // CORS / network — open in a new tab so the viewer can save manually.
            try {
                window.open(trimmed, "_blank", "noopener");
            } catch {
                Toaster.error("Could not download this file.");
            }
        }
        return;
    }

    try {
        // The new expo-file-system API doesn't surface byte progress — show an
        // indeterminate spinner while the file downloads to cache.
        onProgress?.(null);
        const result = await File.downloadFileAsync(trimmed, new File(Paths.cache, name));
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri);
        } else {
            Toaster.success("Saved to app cache");
        }
    } catch {
        Toaster.error("Could not download this file.");
    }
}
