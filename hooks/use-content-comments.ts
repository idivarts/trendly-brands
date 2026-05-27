/**
 * use-content-comments
 *
 * Subscribes to `brands/{brandId}/contents/{contentId}/comments` and provides
 * helpers to add, resolve, and delete comments.
 *
 * This is the shared hook used by BOTH the Content Calendar (QuickCommentModal)
 * and the Content detail page (contents/[contentId].tsx / CommentsSection).
 * They write to the exact same Firestore subcollection, so comments appear
 * on both surfaces automatically via onSnapshot — no sync logic required.
 */
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
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
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export interface ContentComment extends IComment {
    id: string;
}

interface UseContentCommentsReturn {
    comments: ContentComment[];
    loading: boolean;
    /** Add a top-level comment on this content item */
    addComment: (text: string) => Promise<void>;
    /** Reply to an existing comment */
    addReply: (parentId: string, text: string) => Promise<void>;
    /** Toggle resolved state */
    resolveComment: (commentId: string, resolved: boolean) => Promise<void>;
    /** Delete own comment */
    deleteComment: (commentId: string) => Promise<void>;
}

export function useContentComments(contentId: string | null): UseContentCommentsReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [comments, setComments] = useState<ContentComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) {
            setComments([]);
            setLoading(false);
            return;
        }

        const commentsRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "contents",
            contentId,
            "comments"
        );
        const q = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as IComment) })));
                setLoading(false);
            },
            () => setLoading(false)
        );

        return () => unsubscribe();
    }, [selectedBrand?.id, contentId]);

    const refPath = () => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) return null;
        return collection(FirestoreDB, "brands", brandId, "contents", contentId, "comments");
    };

    const buildBase = (): Omit<IComment, "text"> => ({
        authorId: manager?.id ?? "",
        authorName: manager?.name ?? "Unknown",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const addComment = async (text: string) => {
        const ref = refPath();
        if (!ref) return;
        await addDoc(ref, { ...buildBase(), text });
    };

    const addReply = async (parentId: string, text: string) => {
        const ref = refPath();
        if (!ref) return;
        await addDoc(ref, { ...buildBase(), text, parentId });
    };

    const resolveComment = async (commentId: string, resolved: boolean) => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) return;
        await updateDoc(
            doc(FirestoreDB, "brands", brandId, "contents", contentId, "comments", commentId),
            { resolved, updatedAt: Date.now() }
        );
    };

    const deleteComment = async (commentId: string) => {
        const brandId = selectedBrand?.id;
        if (!brandId || !contentId) return;
        await deleteDoc(
            doc(FirestoreDB, "brands", brandId, "contents", contentId, "comments", commentId)
        );
    };

    return { comments, loading, addComment, addReply, resolveComment, deleteComment };
}
