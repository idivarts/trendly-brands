/**
 * use-month-comments
 *
 * Subscribes to `brands/{brandId}/calendarComments/{YYYY-MM}/comments` and
 * provides helpers to add and delete month-level calendar comments.
 *
 * Month key format: "YYYY-MM" e.g. "2026-06"
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
} from "firebase/firestore";
import { useEffect, useState } from "react";

export interface MonthComment extends IComment {
    id: string;
}

interface UseMonthCommentsReturn {
    comments: MonthComment[];
    loading: boolean;
    addComment: (text: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
}

/** Zero-pads a number to two digits */
function pad(n: number): string {
    return String(n).padStart(2, "0");
}

export function useMonthComments(year: number, month: number): UseMonthCommentsReturn {
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [comments, setComments] = useState<MonthComment[]>([]);
    const [loading, setLoading] = useState(true);

    // "YYYY-MM" key (month is 0-indexed from Date, so we display month+1 ... but calMonth
    // and calYear come from useState in the calendar screen where month is 0-based)
    const monthKey = `${year}-${pad(month + 1)}`;

    useEffect(() => {
        const brandId = selectedBrand?.id;
        if (!brandId) {
            setComments([]);
            setLoading(false);
            return;
        }

        const commentsRef = collection(
            FirestoreDB,
            "brands",
            brandId,
            "calendarComments",
            monthKey,
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
    }, [selectedBrand?.id, monthKey]);

    const addComment = async (text: string) => {
        const brandId = selectedBrand?.id;
        if (!brandId) return;
        const ref = collection(
            FirestoreDB,
            "brands",
            brandId,
            "calendarComments",
            monthKey,
            "comments"
        );
        const now = Date.now();
        await addDoc(ref, {
            authorId: manager?.id ?? "",
            authorName: manager?.name ?? "Unknown",
            text,
            calendarMonth: monthKey,
            createdAt: now,
            updatedAt: now,
        } satisfies IComment);
    };

    const deleteComment = async (commentId: string) => {
        const brandId = selectedBrand?.id;
        if (!brandId) return;
        await deleteDoc(
            doc(FirestoreDB, "brands", brandId, "calendarComments", monthKey, "comments", commentId)
        );
    };

    return { comments, loading, addComment, deleteComment };
}
