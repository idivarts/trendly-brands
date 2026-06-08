import PayWallComponent from "@/components/paywall";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";

// Billing for a SPECIFIC organization. Billing is keyed off the active brand's
// org, so we switch the active brand to one belonging to {orgId} (if needed),
// then render the same paywall — which then reflects that org's plan/billing.
const OrgBillingScreen = () => {
    const { orgId } = useLocalSearchParams<{ orgId: string }>();
    const { brands, selectedBrand, setSelectedBrand } = useBrandContext();

    useEffect(() => {
        if (!orgId) return;
        if (selectedBrand?.organizationId === orgId) return;
        const target = brands.find((b) => b.organizationId === orgId);
        if (target) setSelectedBrand(target, false);
    }, [orgId, brands, selectedBrand?.organizationId]);

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["top", "right", "bottom", "left"]}>
            <PageHeader title="Billing" showBackButton />
            <PayWallComponent />
        </AppLayout>
    );
};

export default OrgBillingScreen;
