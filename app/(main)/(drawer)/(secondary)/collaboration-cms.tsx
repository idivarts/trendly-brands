import CollaborationCMSBoard from "@/components/kanban/CollaborationCMSBoard";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const AdminInvites = () => {
    return (
        <AppLayout>
            <PageHeader title="Collaboration CMS" />
            <CollaborationCMSBoard />
        </AppLayout>
    );
};

export default AdminInvites;
