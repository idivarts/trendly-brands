import AIChatPanel, { AIChatControls } from "@/components/shared/AIChatPanel";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faClockRotateLeft, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const WELCOME =
    "Start a new chat, or reopen any conversation from your strategies, calendar and content.";

/**
 * AI Playground — a single hub that lists every AI conversation across all
 * modules (strategy, calendar, content, onboarding, general) and lets the user
 * continue any of them or start a brand-new general chat.
 *
 * Desktop (xl): Claude-style two-pane — conversation list on the left, the
 * active conversation on the right (AIChatPanel `layout="split"`).
 * Mobile (!xl): single-column chat with the list behind the header toggle.
 *
 * The panel's own header is hidden here; its two actions (history toggle + new
 * chat) are surfaced in this screen's PageHeader instead, via `onControlsChange`.
 */
const PlaygroundScreen = () => {
    const { xl } = useBreakpoints();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [controls, setControls] = useState<AIChatControls | null>(null);
    const handleControlsChange = useCallback((c: AIChatControls) => setControls(c), []);

    const actionButtons = useMemo(() => {
        if (!controls) return [];
        return [
            <Pressable
                key="history"
                onPress={controls.toggleHistory}
                style={({ pressed }) => [
                    styles.iconButton,
                    (pressed || controls.historyActive) && styles.iconButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Conversation history"
            >
                <FontAwesomeIcon
                    icon={faClockRotateLeft}
                    size={16}
                    color={controls.historyActive ? colors.onPrimary : colors.text}
                />
            </Pressable>,
            <Pressable
                key="new-chat"
                onPress={controls.newChat}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Start a new chat"
            >
                <FontAwesomeIcon icon={faPenToSquare} size={16} color={colors.text} />
            </Pressable>,
        ];
    }, [controls, styles, colors]);

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Playground"
                subtitle="All your AI conversations in one place"
                showBackButton={!xl}
                mobileActions="all"
                actionButtons={actionButtons}
            />
            <View style={styles.panelWrap}>
                <AIChatPanel
                    module="general"
                    scope="all"
                    layout="split"
                    title="Playground"
                    welcomeText={WELCOME}
                    // The panel's actions live in this screen's PageHeader instead.
                    hideHeader
                    onControlsChange={handleControlsChange}
                    // PageHeader owns the top inset and AppLayout owns the
                    // bottom — the panel must not add either again.
                    parentHandlesSafeArea
                />
            </View>
        </AppLayout>
    );
};

export default PlaygroundScreen;

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                panelWrap: { flex: 1 },
                iconButton: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                iconButtonPressed: { opacity: 0.7 },
                iconButtonActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.35,
                    elevation: 3,
                },
            }),
        [colors]
    );
}
