import BrandCRMBoard from "@/components/kanban/BrandCRMBoard";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const AdminInvites = () => {
    return (
        <AppLayout>
            <PageHeader
                title="Brands CRM"
                showBackButton={false}
            />
            <BrandCRMBoard />
        </AppLayout>
    );
};

export default AdminInvites;
