import EmptyPromptView from "@/components/content-strategy/EmptyPromptView";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import { ContentStrategy } from "@/components/content-strategy/types";
import { useSidebarParam } from "@/components/drawer-layout/use-sidebar-param";
import PageHeader from "@/components/ui/page-header";
import { useBreakpoints } from "@/hooks";
import { useStrategies } from "@/hooks/use-strategies";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

const ContentStrategiesIndex = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const router = useRouter();
    const { strategies, addStrategy } = useStrategies();
    useSidebarParam();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const styles = useMemo(() => useStyles(colors), [colors]);

    // Create a draft strategy from the first prompt and hand off to the
    // detail route, which owns the collecting + strategy-ready states.
    // The prompt rides along as a query param so the AI chat panel can
    // dispatch it as its first message.
    const handleFirstPrompt = useCallback(
        async (prompt: string) => {
            const newStratId = await addStrategy("New Strategy", "");
            if (!newStratId) return;
            router.push({
                pathname: "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
                params: { strategyId: newStratId, initialPrompt: prompt },
            });
        },
        [addStrategy, router]
    );

    const handleSelectStrategy = useCallback(
        (strategy: ContentStrategy) => {
            router.push({
                pathname: "/(main)/(drawer)/(tabs)/(content)/content-strategies/[strategyId]" as any,
                params: { strategyId: strategy.id },
            });
        },
        [router]
    );

    const headerLeftAction = useMemo(() => {
        if (strategies.length === 0) return null;
        return (
            <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => setDrawerOpen(true)}
            >
                <FontAwesomeIcon icon={faBars} size={18} color={colors.text} />
            </Pressable>
        );
    }, [strategies.length, colors.text, styles]);

    return (
        <AppLayout>
            <PageHeader
                title={xl ? "Content Strategy" : "Strategy"}
                subtitle="Form a strategy before putting it in actionable content"
                showBackButton={false}
                rightComponent={headerLeftAction}
                mobileActions="all"
            />

            <EmptyPromptView
                onSubmit={handleFirstPrompt}
                strategies={strategies}
                onSelectStrategy={handleSelectStrategy}
            />

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={null}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
            />
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                iconBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                iconBtnPressed: {
                    opacity: 0.7,
                },
            }),
        [colors]
    );
}

export default ContentStrategiesIndex;
