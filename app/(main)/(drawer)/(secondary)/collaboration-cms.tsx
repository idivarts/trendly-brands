import CollaborationCMSBoard, {
    CollaborationCMSCampaignFilter,
    type CollaborationCMSLiveFilter,
} from "@/components/kanban/CollaborationCMSBoard";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";

const AdminInvites = () => {
    const [liveFilter, setLiveFilter] = useState<CollaborationCMSLiveFilter>("none");

    return (
        <AppLayout>
            <PageHeader
                title="Collaboration CMS"
                rightComponent={
                    <CollaborationCMSCampaignFilter
                        liveFilter={liveFilter}
                        onLiveFilterChange={setLiveFilter}
                    />
                }
                mobileActions="all"
            />
            <CollaborationCMSBoard liveFilter={liveFilter} />
        </AppLayout>
    );
};

export default AdminInvites;
