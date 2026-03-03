import InviteManagementBoard from "@/components/kanban/InviteManagementBoard";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const AdminInvites = () => {
    return (
        <AppLayout>
            <PageHeader title="Invites Management" />
            <InviteManagementBoard />
        </AppLayout>
    );
};

export default AdminInvites;
