import ContentLibraryView from "@/components/contents/ContentLibraryView";
import { useContents } from "@/hooks/use-contents";
import React, { useMemo } from "react";

/** Gallery-only library page: content scheduled to publish. */
const ScheduledContentScreen = () => {
    const { items } = useContents();
    const scheduled = useMemo(
        () => items.filter((i) => !i.isArchived && i.status === "scheduled"),
        [items]
    );

    return (
        <ContentLibraryView
            title="Scheduled"
            subtitle="Content queued to publish"
            items={scheduled}
            emptyText="Nothing scheduled yet."
        />
    );
};

export default ScheduledContentScreen;
