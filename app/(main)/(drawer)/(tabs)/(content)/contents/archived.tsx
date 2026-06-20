import ContentLibraryView from "@/components/contents/ContentLibraryView";
import { useContents } from "@/hooks/use-contents";
import React, { useMemo } from "react";

/** Gallery-only library page: archived / deleted content. */
const ArchivedContentScreen = () => {
    const { items } = useContents();
    const archived = useMemo(() => items.filter((i) => i.isArchived), [items]);

    return (
        <ContentLibraryView
            title="Archived / Deleted"
            subtitle="Content you've archived"
            items={archived}
            emptyText="No archived content."
        />
    );
};

export default ArchivedContentScreen;
