import PayWallComponent from "@/components/paywall";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React from "react";

// Billing for the CURRENT organization (the active brand's org). Billing is
// org-level — PayWallComponent reads the selected brand's org billing.
const BillingScreen = () => {
    const { xl } = useBreakpoints();
    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["right", "bottom", "left"]}>
            <PageHeader title="Billing" showBackButton />
            <PayWallComponent />
        </AppLayout>
    );
};

export default BillingScreen;
