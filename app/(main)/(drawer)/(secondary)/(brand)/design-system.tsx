import DesignSystemEditor from "@/components/design-system";
import { useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useDesignSystem } from "@/hooks/use-design-system";
import AppLayout from "@/layouts/app-layout";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const DesignSystemScreen = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { selectedBrand, loading: brandLoading } = useBrandContext();
    const { draft, loading, saving, dirty, patch, save } = useDesignSystem();
    const { setCollapsed } = useSidebarCollapsed();

    // Auto-collapse the web drawer when this page opens so the editor + preview
    // get the full width (no-op on native, where the context default is inert).
    useEffect(() => {
        setCollapsed(true);
    }, [setCollapsed]);

    // Wait for the brand context to finish loading before rendering anything —
    // opening the editor against an unresolved brand would flash empty/wrong data
    // (mirrors how other brand-scoped pages gate on the context's loading flag).
    if (brandLoading) {
        return (
            <AppLayout>
                <View style={styles.loader}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </AppLayout>
        );
    }

    // Loaded but no brand selected — the drawer's guards handle a genuinely
    // missing brand, so just render nothing here.
    if (!selectedBrand) {
        return null;
    }

    const handleSave = async () => {
        try {
            await save();
            Toaster.success("Design System saved");
        } catch {
            Toaster.error("Could not save the Design System");
        }
    };

    return (
        <AppLayout withWebPadding={false}>
            <PageHeader
                title="Design System"
                subtitle={selectedBrand.name}
                mobileActions="all"
                actionButtons={[
                    <Button
                        key="save"
                        mode="contained"
                        loading={saving}
                        disabled={!dirty || saving}
                        onPress={handleSave}
                    >
                        Save
                    </Button>,
                ]}
            />
            <AppLayout safeAreaEdges={["bottom", "left", "right"]}>
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : (
                    <DesignSystemEditor ds={draft} onPatch={patch} />
                )}
            </AppLayout>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    loader: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default DesignSystemScreen;
