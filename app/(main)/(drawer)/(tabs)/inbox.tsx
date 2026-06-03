import PageHeader from "@/components/ui/page-header";
import InboxView from "@/components/inbox/InboxView";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import React from "react";

// ── MOCK LAYER (remove with the rest of the mock — see components/inbox/README.md) ──
import DevStateSwitcher from "@/components/inbox/mock/DevStateSwitcher";
import { MockScenarioProvider } from "@/components/inbox/mock/mock-scenario-context";
// ────────────────────────────────────────────────────────────────────────────────

const InboxScreen = () => {
    const { selectedBrand } = useBrandContext();

    return (
        // MOCK: MockScenarioProvider wraps the screen only to power the demo
        // state-switcher. Remove the provider (and DevStateSwitcher below) when
        // wiring the real backend.
        <MockScenarioProvider>
            <AppLayout withWebPadding={false} safeAreaEdges={["left", "right"]}>
                <PageHeader
                    title="Inbox"
                    subtitle={selectedBrand?.name}
                    showBackButton={false}
                    mobileActions="all"
                />
                <AppLayout
                    withWebPadding={false}
                    safeAreaEdges={["bottom", "left", "right"]}
                >
                    <InboxView />
                </AppLayout>
                {/* MOCK: demo state-switcher */}
                <DevStateSwitcher />
            </AppLayout>
        </MockScenarioProvider>
    );
};

export default InboxScreen;
