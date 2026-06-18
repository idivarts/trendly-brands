import AIChatPanel from "@/components/shared/AIChatPanel";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import React from "react";
import { StyleSheet, View } from "react-native";

const WELCOME =
    "Hi! This is your Playground — every AI conversation across your strategies, " +
    "calendar and content lives here, and you can start a fresh general chat any " +
    "time. What would you like to work on?";

/**
 * AI Playground — a single hub that lists every AI conversation across all
 * modules (strategy, calendar, content, onboarding, general) and lets the user
 * continue any of them or start a brand-new general chat.
 *
 * Desktop (xl): Claude-style two-pane — conversation list on the left, the
 * active conversation on the right (AIChatPanel `layout="split"`).
 * Mobile (!xl): single-column chat with the list behind the header toggle.
 */
const PlaygroundScreen = () => {
    const { xl } = useBreakpoints();

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Playground"
                subtitle="All your AI conversations in one place"
                showBackButton={!xl}
                mobileActions="all"
            />
            <View style={styles.panelWrap}>
                <AIChatPanel
                    module="general"
                    scope="all"
                    layout="split"
                    title="Playground"
                    placeholder="Ask anything…"
                    welcomeText={WELCOME}
                    // PageHeader owns the top inset and AppLayout owns the
                    // bottom — the panel must not add either again.
                    parentHandlesSafeArea
                />
            </View>
        </AppLayout>
    );
};

export default PlaygroundScreen;

const styles = StyleSheet.create({
    panelWrap: { flex: 1 },
});
