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
 *
 * A measurement is only ADOPTED when it falls inside the content type's accepted
 * aspect range. An out-of-range asset (a landscape clip sitting on a Reel, say)
 * keeps the canonical shape and letterboxes inside it — otherwise the box
 * silently takes the wrong shape while the ratio chip beside it still claims
 * "9:16". See isAspectAccepted in media-spec.ts.
 */
import { ContentType } from "@/components/content-calendar/types";
import { Attachment } from "@/shared-libs/firestore/trendly-pro/constants/attachment";
import { useCallback, useEffect, useState } from "react";
import { Image } from "react-native";
import { isAspectAccepted } from "./media-spec";

const isVideoAttachment = (a?: Attachment) => a?.type === "video" || a?.type === "reel";

export function useMediaAspect(
    attachment: Attachment | undefined,
    fallback: number,
    /**
     * When given, a measured ratio is only used if this type accepts it. Omit to
     * take any measurement (e.g. a free-form canvas with no target ratio).
     */
    contentType?: ContentType
) {
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

    // An out-of-range measurement is discarded in favour of the canonical ratio.
    const usable =
        measured !== undefined &&
        (contentType === undefined || isAspectAccepted(contentType, measured));

    return { aspect: usable ? measured : fallback, onVideoNaturalSize };
}
