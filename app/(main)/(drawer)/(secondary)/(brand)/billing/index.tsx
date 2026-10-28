import PayWallComponent from "@/components/paywall";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import { isUpgradeSource } from "@/shared-constants/analytics-events";
import { track } from "@/shared-libs/utils/analytics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";

// Billing for the CURRENT organization (the active brand's org). Billing is
// org-level — PayWallComponent reads the selected brand's org billing.
const BillingScreen = () => {
    const { xl } = useBreakpoints();
    const { from } = useLocalSearchParams<{ from?: string }>();

    // The onboarding gate at /pay-wall already reports itself; this is the
    // OTHER way in, and without it there is no denominator for "saw pricing →
    // upgraded" on any in-app upgrade.
    //
    // `from` is set by goToBilling(), so the trigger finally names which of the
    // fourteen doors sent the user here instead of collapsing all of them into
    // "billing_screen" — which could not answer why anyone was looking at
    // pricing. It arrives as an untrusted query param, hence the narrowing;
    // anything unrecognised falls back rather than inventing a trigger value.
    useEffect(() => {
        track("paywall_viewed", {
            trigger: isUpgradeSource(from) ? from : "billing_screen",
        });
    }, [from]);
    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["right", "bottom", "left"]}>
            <PageHeader title="Billing" showBackButton />
            <PayWallComponent />
        </AppLayout>
    );
};

export default BillingScreen;
