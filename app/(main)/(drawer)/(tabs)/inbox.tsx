import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const InboxScreen = () => {
    const { selectedBrand } = useBrandContext();

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="Inbox"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                mobileActions="all"
            />
            <AppLayout withWebPadding={true} safeAreaEdges={["bottom", "left", "right"]}>
                {/* TODO: unified messages & comments inbox across connected socials */}
            </AppLayout>
        </AppLayout>
    );
};

export default InboxScreen;
