/**
 * ContentCommentsPanel
 *
 * Thin wrapper around SharedCommentsPanel for the Content Detail screen.
 * Connects useContentComments — enables threading and resolve since content
 * comments support the full feature set.
 *
 * Because this hook writes to the same Firestore path that the Calendar's
 * item-level comments use, comments posted from the Calendar automatically
 * appear here too (and vice versa) with no extra sync needed.
 */
import SharedCommentsPanel from "@/components/shared/CommentsPanel";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useContentComments } from "@/hooks/use-content-comments";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import React from "react";

interface ContentCommentsPanelProps {
    contentId: string | null;
    onCollapse?: () => void;
}

const ContentCommentsPanel: React.FC<ContentCommentsPanelProps> = ({
    contentId,
    onCollapse,
}) => {
    const { manager } = useAuthContext();
    const { comments, loading, addComment, addReply, resolveComment, deleteComment } =
        useContentComments(contentId);

    return (
        <SharedCommentsPanel
            comments={comments}
            loading={loading}
            onAddComment={addComment}
            onAddReply={addReply}
            onResolveComment={resolveComment}
            onDeleteComment={deleteComment}
            title="Comments"
            titleIcon={faCommentDots}
            onCollapse={onCollapse}
            currentUserId={manager?.id ?? ""}
            placeholder="Add a comment..."
            emptyText="No comments yet. Notes added from the calendar also appear here."
        />
    );
};

export default ContentCommentsPanel;
