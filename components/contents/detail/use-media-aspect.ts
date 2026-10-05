/**
 * use-media-aspect — the true width/height ratio of a media attachment.
 *
 * Attachments store only URLs, so the real dimensions have to be measured at
 * runtime: `Image.getSize` for images, and expo-av's `onReadyForDisplay`
 * naturalSize for video (fed back in via `onVideoNaturalSize`).
 *
 * Until a measurement lands — and if one never does — the caller's fallback (the
 * content type's canonical ratio) is used, so a preview is correctly shaped on
 * first paint rather than briefly landscape.
 */
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { useCallback, useEffect, useState } from "react";
import { Image } from "react-native";

const isVideoAttachment = (a?: Attachment) => a?.type === "video" || a?.type === "reel";

export function useMediaAspect(attachment: Attachment | undefined, fallback: number) {
    const [measured, setMeasured] = useState<number | undefined>(undefined);

    const url = attachment?.imageUrl;
    const isVideo = isVideoAttachment(attachment);

    // Images: measure off the URL. Guard against a late response for a URL the
    // user has already replaced.
    useEffect(() => {
        setMeasured(undefined);
        if (isVideo || !url) return;
        let active = true;
        Image.getSize(
            url,
            (w, h) => {
                if (active && w > 0 && h > 0) setMeasured(w / h);
            },
            () => {
                /* unmeasurable — the fallback stands */
            }
        );
        return () => {
            active = false;
        };
    }, [url, isVideo]);

    /** Feed expo-av's naturalSize in from <Video onReadyForDisplay>. */
    const onVideoNaturalSize = useCallback((size?: { width: number; height: number }) => {
        if (size && size.width > 0 && size.height > 0) setMeasured(size.width / size.height);
    }, []);

    return { aspect: measured ?? fallback, onVideoNaturalSize };
}
