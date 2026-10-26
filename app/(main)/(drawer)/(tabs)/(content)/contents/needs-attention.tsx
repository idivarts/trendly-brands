import ContentLibraryView from "@/components/contents/ContentLibraryView";
import { useContents } from "@/hooks/use-contents";
import React, { useMemo } from "react";

/**
 * Gallery-only library page: publishes that did not finish.
 *
 * `failed` (nothing went out) and `partially_failed` (some platforms are live,
 * some are not) had nowhere to appear. The board's lanes cover the authoring
 * funnel and the terminal links cover scheduled / posted / archived, so a
 * publish that broke fell out of both and the content became unreachable from
 * this screen — the one state on it that actually needs somebody to act.
 */
const NeedsAttentionContentScreen = () => {
    const { items } = useContents();
    const needsAttention = useMemo(
        () =>
            items.filter(
                (i) =>
                    !i.isArchived &&
                    (i.status === "failed" || i.status === "partially_failed")
            ),
        [items]
    );

    return (
        <ContentLibraryView
            title="Needs attention"
            subtitle="Publishes that failed or only went out in part"
            items={needsAttention}
            emptyText="Nothing needs attention — every publish went through."
        />
    );
};

export default NeedsAttentionContentScreen;
