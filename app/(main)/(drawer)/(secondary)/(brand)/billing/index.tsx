import PayWallComponent from "@/components/paywall";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { track } from "@/shared-libs/utils/analytics";
import React, { useEffect } from "react";

// Billing for the CURRENT organization (the active brand's org). Billing is
// org-level — PayWallComponent reads the selected brand's org billing.
const BillingScreen = () => {
    const { xl } = useBreakpoints();

    // The onboarding gate at /pay-wall already reports itself; this is the
    // OTHER way in, and without it there is no denominator for "saw pricing →
    // upgraded" on any in-app upgrade.
    useEffect(() => {
        track("paywall_viewed", { trigger: "billing_screen" });
    }, []);
    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["right", "bottom", "left"]}>
            <PageHeader title="Billing" showBackButton />
            <PayWallComponent />
        </AppLayout>
    );
};

export default BillingScreen;
