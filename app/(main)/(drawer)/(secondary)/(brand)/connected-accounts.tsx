import ConnectedAccounts from "@/components/connected-accounts";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import React from "react";

const ConnectedAccountsScreen = () => {
    const { selectedBrand } = useBrandContext();

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Connected Accounts"
                subtitle={selectedBrand?.name}
            />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                <ConnectedAccounts />
            </AppLayout>
        </AppLayout>
    );
};

export default ConnectedAccountsScreen;
