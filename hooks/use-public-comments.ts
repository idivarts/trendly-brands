/**
 * use-public-comments
 *
 * Comments hook for the PUBLIC share pages. Unlike use-content-comments /
 * use-strategy-comments it does not read the brand/auth contexts (those aren't
 * mounted under the (public) layout) — the viewer identity is passed in
 * explicitly. Used only for Tier-2 (guest) and Tier-3 (member) viewers; the
 * caller hides it entirely for anonymous viewers.
 *
 * Reads/writes the same subcollections as the in-app hooks, so guest comments
 * show up live inside the brand workspace too:
 *   - strategy → brands/{brandId}/strategies/{resourceId}/comments
 *   - content  → brands/{brandId}/contents/{resourceId}/comments
 */
import { IComment } from "@/shared-libs/firestore/trendly-pro/models/comments";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export interface PublicCommentItem extends IComment {
    id: string;
}

export type PublicCommentResource = "strategies" | "contents";

interface Params {
    brandId: string | undefined;
    resource: PublicCommentResource;
    resourceId: string | undefined;
    viewerId: string | null;
    viewerName: string | null;
}

interface Return {
    comments: PublicCommentItem[];
    loading: boolean;
    /** Whether the viewer is allowed to post (real, identified user). */
    canPost: boolean;
    addComment: (text: string) => Promise<void>;
    addReply: (parentId: string, text: string) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
}

export const usePublicComments = ({
    brandId,
    resource,
    resourceId,
    viewerId,
    viewerName,
}: Params): Return => {
    const [comments, setComments] = useState<PublicCommentItem[]>([]);
    const [loading, setLoading] = useState(true);

    const canPost = !!viewerId;

    useEffect(() => {
        if (!brandId || !resourceId) {
            setComments([]);
            setLoading(false);
            return;
        }
        const ref = collection(
            FirestoreDB,
            "brands",
            brandId,
            resource,
            resourceId,
            "comments"
        );
        const q = query(ref, orderBy("createdAt", "asc"));
        const unsub = onSnapshot(
            q,
            (snap) => {
                setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as IComment) })));
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [brandId, resource, resourceId]);

    const refPath = () => {
        if (!brandId || !resourceId) return null;
        return collection(FirestoreDB, "brands", brandId, resource, resourceId, "comments");
    };

    const base = () => ({
        authorId: viewerId ?? "",
        authorName: viewerName ?? "Guest",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const addComment = async (text: string) => {
        const ref = refPath();
        if (!ref || !canPost) return;
        await addDoc(ref, { ...base(), text });
    };

    const addReply = async (parentId: string, text: string) => {
        const ref = refPath();
        if (!ref || !canPost) return;
        await addDoc(ref, { ...base(), text, parentId });
    };

    const deleteComment = async (id: string) => {
        if (!brandId || !resourceId) return;
        await deleteDoc(
            doc(FirestoreDB, "brands", brandId, resource, resourceId, "comments", id)
        );
    };

    return { comments, loading, canPost, addComment, addReply, deleteComment };
};
