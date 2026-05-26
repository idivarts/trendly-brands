/**
 * CalendarCommentsPanel
 *
 * Thin wrapper around SharedCommentsPanel for the Content Calendar screen.
 * Handles two contexts — always calls both hooks (React rules), uses the
 * relevant one based on selectedItem:
 *
 *   selectedItem = null  → month-level notes (flat, no resolve/reply)
 *   selectedItem = item  → content item comments (threaded + resolve)
 *
 * The breadcrumb "← Month" header is driven by onBack + backLabel props.
 */
import SharedCommentsPanel from "@/components/shared/CommentsPanel";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useContentComments } from "@/hooks/use-content-comments";
import { useMonthComments } from "@/hooks/use-month-comments";
import { faCalendarDays, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { CalendarItem } from "./types";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface CalendarCommentsPanelProps {
    year: number;
    month: number; // 0-indexed
    /** When set, shows item-level comments; null = month-level notes. */
    selectedItem: CalendarItem | null;
    /** Called when the user taps the "← Month" back button. */
    onClearSelectedItem: () => void;
    /** Called when the user taps the collapse chevron in the panel header. */
    onCollapse?: () => void;
}

const CalendarCommentsPanel: React.FC<CalendarCommentsPanelProps> = ({
    year,
    month,
    selectedItem,
    onClearSelectedItem,
    onCollapse,
}) => {
    const { manager } = useAuthContext();

    // Always call both hooks — hooks cannot be conditional.
    const monthHook = useMonthComments(year, month);
    const itemHook = useContentComments(selectedItem?.id ?? null);

    const isItemMode = selectedItem !== null;
    const { comments, loading, addComment, deleteComment } = isItemMode ? itemHook : monthHook;

    const monthLabel = `${MONTH_NAMES[month]} ${year}`;

    return (
        <SharedCommentsPanel
            comments={comments}
            loading={loading}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            // Threading and resolve only available in item mode
            onAddReply={isItemMode ? itemHook.addReply : undefined}
            onResolveComment={isItemMode ? itemHook.resolveComment : undefined}
            title={isItemMode ? selectedItem.title : monthLabel}
            titleIcon={isItemMode ? faCommentDots : faCalendarDays}
            onCollapse={onCollapse}
            // Back button breadcrumb — shown only in item mode
            onBack={isItemMode ? onClearSelectedItem : undefined}
            backLabel={isItemMode ? "Month" : undefined}
            currentUserId={manager?.id ?? ""}
            placeholder={isItemMode ? "Comment on this item..." : "Add a note for this month..."}
            emptyText={
                isItemMode
                    ? "No comments on this item yet."
                    : `No notes for ${monthLabel} yet.`
            }
        />
    );
};

export default CalendarCommentsPanel;
