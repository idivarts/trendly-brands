import { CalendarItem, ContentType } from "@/components/content-calendar/types";
import { ContentItem, ContentStatus, SocialDestination } from "@/components/contents/types";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    IContent,
    ContentStatus as FSContentStatus,
} from "@/shared-libs/firestore/trendly-pro/models/contents";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Convert an epoch timestamp to an ISO date string ("YYYY-MM-DD").
 * Falls back to today if the value is falsy.
 */
function epochToIsoDate(epoch: number | undefined): string {
    if (!epoch) return new Date().toISOString().split("T")[0];
    return new Date(epoch).toISOString().split("T")[0];
}

/**
 * Firestore `IContent` → local `ContentItem` used by the UI layer.
 */
function toContentItem(id: string, data: IContent): ContentItem {
    return {
        id,
        title: data.title,
        idea: data.description ?? "",
        date: epochToIsoDate(data.postingTimeStamp),
        type: (data.contentFormat as ContentType) ?? "post",
        status: (data.status as ContentStatus) ?? "draft",
        caption: data.caption,
        hashtags: data.hashtags,
        timeOfPosting: data.timeOfPosting,
        script: data.script,
        imagePrompt: data.imagePrompt,
        attachments: data.attachments,
        imageGeneration: data.imageGeneration,
        destinations: data.destinations as SocialDestination[] | undefined,
        scheduleMode: data.scheduleMode,
        scheduledAt: data.scheduledAt,
        publishedIds: data.publishedIds,
        postedUrl: data.postedUrl,
        isArchived: data.isArchived ?? false,
        commentCount: data.commentCount ?? 0,
        createdAt: epochToIsoDate(data.createdAt),
    };
}

/**
 * Local `CalendarItem` (plus optional extra ContentItem fields) → `IContent`
 * ready to be written to Firestore.
 */
function toIContent(
    item: Omit<CalendarItem, "id">,
    managerId: string,
    extra: Partial<ContentItem> = {}
): IContent {
    const now = Date.now();
    // Parse the ISO date string to an epoch. Use midnight UTC.
    const postingTs = item.date
        ? new Date(item.date + "T00:00:00Z").getTime()
        : undefined;

    const doc: IContent = {
        title: item.title,
        managerId,
        description: item.idea,
        platform: "Instagram", // Default — no platform selector in AddContentModal yet
        contentFormat: item.type,
        status: FSContentStatus.Draft,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
    };

    // Only include optional fields when they have a real value — Firestore
    // rejects documents that contain `undefined` as a field value.
    if (postingTs !== undefined)       doc.postingTimeStamp = postingTs;
    if (extra.caption !== undefined)   doc.caption = extra.caption;
    if (extra.hashtags !== undefined)  doc.hashtags = extra.hashtags;
    if (extra.timeOfPosting !== undefined) doc.timeOfPosting = extra.timeOfPosting;
    if (extra.script !== undefined)    doc.script = extra.script;
    if (extra.imagePrompt !== undefined) doc.imagePrompt = extra.imagePrompt;
    if (extra.attachments !== undefined) doc.attachments = extra.attachments;
    if (extra.destinations !== undefined) doc.destinations = extra.destinations;
    if (extra.scheduleMode !== undefined) doc.scheduleMode = extra.scheduleMode;
    if (extra.scheduledAt !== undefined) doc.scheduledAt = extra.scheduledAt;

    return doc;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseContentsReturn {
    /** All content items for the current brand, mapped to the UI type */
    items: ContentItem[];
    loading: boolean;
    /**
     * Create a new content document under `brands/{brandId}/contents`.
     * Returns the new Firestore document ID, or null if the brand isn't ready.
     */
    addContent: (
        item: Omit<CalendarItem, "id">,
        extra?: Partial<ContentItem>
    ) => Promise<string | null>;
    /**
     * Partially update an existing content document.
     */
    updateContent: (
        contentId: string,
        changes: Partial<IContent>
    ) => Promise<void>;
    /**
     * Permanently delete a content document. Irreversible — gate behind a
     * confirmation. Returns true on success, false if the brand isn't ready
     * or the delete failed.
     */
    deleteContent: (contentId: string) => Promise<boolean>;
}

/**
 * Subscribes to `brands/{brandId}/contents` (ordered by `createdAt` desc)
 * and provides write helpers.
 */
export function useContents(): UseContentsReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setItems([]);
            setLoading(false);
            return;
        }

        const contentsRef = collection(FirestoreDB, "brands", brandId, "contents");
        const q = query(contentsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const mapped = snapshot.docs.map((d) =>
                    toContentItem(d.id, d.data() as IContent)
                );
                setItems(mapped);
                setLoading(false);
            },
            () => {
                // On error, stop loading without crashing
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedBrand?.id]);

    const addContent = async (
        item: Omit<CalendarItem, "id">,
        extra: Partial<ContentItem> = {}
    ): Promise<string | null> => {
        const brandId = selectedBrand?.id;
        const managerId = manager?.id;
        if (!brandId || !managerId) return null;

        const data = toIContent(item, managerId, extra);
        const contentsRef = collection(FirestoreDB, "brands", brandId, "contents");
        const docRef = await addDoc(contentsRef, data);
        return docRef.id;
    };

    const updateContent = async (
        contentId: string,
        changes: Partial<IContent>
    ): Promise<void> => {
        const brandId = selectedBrand?.id;
        if (!brandId) return;

        const docRef = doc(FirestoreDB, "brands", brandId, "contents", contentId);
        await updateDoc(docRef, { ...changes, updatedAt: Date.now() });
    };

    const deleteContent = async (contentId: string): Promise<boolean> => {
        const brandId = selectedBrand?.id;
        if (!brandId) return false;

        try {
            const docRef = doc(FirestoreDB, "brands", brandId, "contents", contentId);
            await deleteDoc(docRef);
            return true;
        } catch (e) {
            console.warn("Delete content error:", e);
            return false;
        }
    };

    return { items, loading, addContent, updateContent, deleteContent };
}
