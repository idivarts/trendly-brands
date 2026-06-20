import InboxModeToggle from "@/components/inbox/InboxModeToggle";
import InboxView from "@/components/inbox/InboxView";
import { InboxMode } from "@/components/inbox/types";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import React, { useState } from "react";

const InboxScreen = () => {
    const { selectedBrand } = useBrandContext();
    const [mode, setMode] = useState<InboxMode>("messages");

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
            <PageHeader
                title="Inbox"
                subtitle={selectedBrand?.name}
                showBackButton={false}
                mobileActions="all"
                actionButtons={[
                    <InboxModeToggle key="mode" mode={mode} onChange={setMode} />,
                ]}
            />
            <AppLayout
                withWebPadding={false}
                safeAreaEdges={["bottom", "left", "right"]}
            >
                <InboxView mode={mode} />
            </AppLayout>
        </AppLayout>
    );
};

export default InboxScreen;
