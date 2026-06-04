import ContentLibraryView from "@/components/contents/ContentLibraryView";
import { useContents } from "@/hooks/use-contents";
import React, { useMemo } from "react";

/** Gallery-only library page: content already published. */
const PostedContentScreen = () => {
    const { items } = useContents();
    const posted = useMemo(
        () => items.filter((i) => !i.isArchived && i.status === "posted"),
        [items]
    );

    return (
        <ContentLibraryView
            title="Posted"
            subtitle="Content that has gone live"
            items={posted}
            emptyText="No posted content yet."
        />
    );
};

export default PostedContentScreen;
