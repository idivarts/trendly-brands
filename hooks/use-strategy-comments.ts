/**
 * use-strategy-comments
 *
 * Subscribes to `brands/{brandId}/strategies/{strategyId}/comments` and
 * provides helpers to add, resolve, and delete comments.
 *
 * Supports both document-level comments and snippet-anchored comments —
 * the distinction is determined by whether `snippet` / `anchorStart` / `anchorEnd`
 * are present on the IComment document.
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

export interface StrategyComment extends IComment {
    id: string;
}

interface UseStrategyCommentsReturn {
    comments: StrategyComment[];
    loading: boolean;
    /** Add a document-level comment */
    addComment: (text: string) => Promise<void>;
    /** Add a snippet-anchored comment */
    addSnippetComment: (
        text: string,
        snippet: string,
        anchorStart: number,
        anchorEnd: number
    ) => Promise<void>;
    /** Reply to an existing comment thread */
    addReply: (parentId: string, text: string) => Promise<void>;
    /** Toggle resolved state on a comment */
    resolveComment: (commentId: string, resolved: boolean) => Promise<void>;
    /** Delete own comment */
    deleteComment: (commentId: string) => Promise<void>;
}

export function useStrategyComments(strategyId: string | null): UseStrategyCommentsReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [comments, setComments] = useState<StrategyComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId || !strategyId) {
            setComments([]);
            setLoading(false);
            return;
        }

        const commentsRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "strategies",
            strategyId,
            "comments"
        );
        const q = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                setComments(
                    snap.docs.map((d) => ({ id: d.id, ...(d.data() as IComment) }))
                );
                setLoading(false);
            },
            () => setLoading(false)
        );

        return () => unsubscribe();
    }, [selectedBrand?.id, strategyId]);

    const buildBase = (): Omit<IComment, "text"> => ({
        authorId: manager?.id ?? "",
        authorName: manager?.name ?? "Unknown",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });

    const commentsRef = () => {
        const brandId = selectedBrand?.id;
        if (!brandId || !strategyId) return null;
        return collection(FirestoreDB, "brands", brandId, "strategies", strategyId, "comments");
    };

    const addComment = async (text: string) => {
        const ref = commentsRef();
        if (!ref) return;
        await addDoc(ref, { ...buildBase(), text });
    };

    const addSnippetComment = async (
        text: string,
        snippet: string,
        anchorStart: number,
        anchorEnd: number
    ) => {
        const ref = commentsRef();
        if (!ref) return;
        await addDoc(ref, { ...buildBase(), text, snippet, anchorStart, anchorEnd });
    };

    const addReply = async (parentId: string, text: string) => {
        const ref = commentsRef();
        if (!ref) return;
        await addDoc(ref, { ...buildBase(), text, parentId });
    };

    const resolveComment = async (commentId: string, resolved: boolean) => {
        const brandId = selectedBrand?.id;
        if (!brandId || !strategyId) return;
        const docRef = doc(
            FirestoreDB,
            "brands",
            brandId,
            "strategies",
            strategyId,
            "comments",
            commentId
        );
        await updateDoc(docRef, { resolved, updatedAt: Date.now() });
    };

    const deleteComment = async (commentId: string) => {
        const brandId = selectedBrand?.id;
        if (!brandId || !strategyId) return;
        const docRef = doc(
            FirestoreDB,
            "brands",
            brandId,
            "strategies",
            strategyId,
            "comments",
            commentId
        );
        await deleteDoc(docRef);
    };

    return { comments, loading, addComment, addSnippetComment, addReply, resolveComment, deleteComment };
}
