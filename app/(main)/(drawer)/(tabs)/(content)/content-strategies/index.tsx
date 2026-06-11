import CollaboratorsSection from "@/components/content-strategy/CollaboratorsSection";
import EmptyPromptView from "@/components/content-strategy/EmptyPromptView";
import StrategiesDrawer from "@/components/content-strategy/StrategiesDrawer";
import { ContentStrategy } from "@/components/content-strategy/types";
import { useSidebarParam } from "@/components/drawer-layout/use-sidebar-param";
import ShareModal from "@/components/sharing/ShareModal";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useStrategies } from "@/hooks/use-strategies";
import AppLayout from "@/layouts/app-layout";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import Toaster from "@/shared-uis/components/toaster/Toaster";
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
    const { strategies, addStrategy, duplicateStrategy, deleteStrategy } = useStrategies();
    const { openModal } = useConfirmationModel();
    const { selectedBrand, hasCapability } = useBrandContext();
    useSidebarParam();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [shareStrategy, setShareStrategy] = useState<ContentStrategy | null>(null);
    const styles = useStyles(colors);

    // Public sharing is gated on the same capability the toolbar's Share uses.
    const canShare = hasCapability("manage_content_strategy") && !!selectedBrand?.id;

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

    const handleDuplicateStrategy = useCallback(
        async (strategy: ContentStrategy) => {
            const newId = await duplicateStrategy(strategy.id);
            if (newId) {
                Toaster.success("Strategy duplicated", `A copy of "${strategy.title}" was created.`);
            } else {
                Toaster.error("Couldn't duplicate", "Please try again.");
            }
        },
        [duplicateStrategy]
    );

    const handleDeleteStrategy = useCallback(
        (strategy: ContentStrategy) => {
            openModal({
                title: "Delete strategy?",
                description: `"${strategy.title}" will be permanently deleted. This is an irreversible action and cannot be undone.`,
                confirmText: "Delete Strategy",
                cancelText: "Cancel",
                confirmAction: async () => {
                    const ok = await deleteStrategy(strategy.id);
                    if (ok) {
                        Toaster.success("Strategy deleted", `"${strategy.title}" was removed.`);
                    } else {
                        Toaster.error("Couldn't delete", "Please try again.");
                    }
                },
            });
        },
        [openModal, deleteStrategy]
    );

    const handleShareStrategy = useCallback((strategy: ContentStrategy) => {
        setShareStrategy(strategy);
    }, []);

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
                onDuplicateStrategy={handleDuplicateStrategy}
                onDeleteStrategy={handleDeleteStrategy}
                onShareStrategy={canShare ? handleShareStrategy : undefined}
            />

            <StrategiesDrawer
                visible={drawerOpen}
                strategies={strategies}
                activeId={null}
                onSelect={handleSelectStrategy}
                onClose={() => setDrawerOpen(false)}
                onDuplicate={handleDuplicateStrategy}
                onDelete={handleDeleteStrategy}
                onShare={canShare ? handleShareStrategy : undefined}
            />

            {shareStrategy && selectedBrand?.id && (
                <ShareModal
                    visible={!!shareStrategy}
                    target={{
                        type: "strategy",
                        brandId: selectedBrand.id,
                        resourceId: shareStrategy.id,
                    }}
                    title={shareStrategy.title || "Untitled strategy"}
                    onClose={() => setShareStrategy(null)}
                    extraSection={
                        <CollaboratorsSection
                            strategyId={shareStrategy.id}
                            collaboratorIds={shareStrategy.collaboratorIds ?? []}
                        />
                    }
                />
            )}
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
