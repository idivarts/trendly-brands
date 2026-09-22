/**
 * CommentsPanel (Strategy)
 *
 * Thin wrapper around SharedCommentsPanel for the strategy screen.
 * Connects useStrategyComments and enables all features:
 *  - Threading (replies)
 *  - Resolve / unresolve
 *  - Snippet quotes (shown when a comment has a .snippet field)
 */
import SharedCommentsPanel, { PanelComment } from "@/components/shared/CommentsPanel";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useStrategyComments } from "@/hooks/use-strategy-comments";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import React from "react";

interface CommentsPanelProps {
    strategyId: string | null;
    onCollapse?: () => void;
    onSendToAI?: (comment: PanelComment) => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ strategyId, onCollapse, onSendToAI }) => {
    const { manager } = useAuthContext();
    const { comments, loading, addComment, addReply, resolveComment, deleteComment } =
        useStrategyComments(strategyId);

    // Expose each comment's anchored passage as a structured focusArea so
    // "Send to AI" builds a comment focus that inherits the exact snippet.
    const panelComments: PanelComment[] = comments.map((c) => ({
        ...c,
        focusArea:
            c.snippet && strategyId
                ? {
                      type: "strategy-snippet",
                      strategyId,
                      snippet: c.snippet,
                      anchorStart: c.anchorStart,
                      anchorEnd: c.anchorEnd,
                  }
                : undefined,
    }));

    return (
        <SharedCommentsPanel
            comments={panelComments}
            loading={loading}
            onAddComment={addComment}
            onAddReply={addReply}
            onResolveComment={resolveComment}
            onDeleteComment={deleteComment}
            onSendToAI={onSendToAI}
            title="Comments"
            titleIcon={faCommentDots}
            onCollapse={onCollapse}
            currentUserId={manager?.id ?? ""}
            placeholder="Add a comment..."
            emptyText="No comments yet. Select text in the editor to leave an inline note, or add one below."
        />
    );
};

export default CommentsPanel;
