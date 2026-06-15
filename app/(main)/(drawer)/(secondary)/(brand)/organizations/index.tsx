import EntityCard from "@/components/organization/EntityCard";
import NameInputModal from "@/components/organization/NameInputModal";
import PlanUsageChip from "@/components/organization/PlanUsageChip";
import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import PageHeader from "@/components/ui/page-header";
import { useOrganizationContext } from "@/contexts/organization-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";

const OrganizationsScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);
    const router = useRouter();

    const { organizations, loading, refresh, createOrganization } = useOrganizationContext();
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const handleCreate = async (name: string) => {
        if (!name) return;
        setCreating(true);
        const org = await createOrganization(name);
        setCreating(false);
        if (org) {
            setCreateOpen(false);
            router.push({ pathname: "/organizations/[orgId]", params: { orgId: org.id } });
        }
    };

    const openOrg = (orgId: string) => {
        router.push({ pathname: "/organizations/[orgId]", params: { orgId } });
    };

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["right", "bottom", "left"]}>
            <PageHeader
                title="Organizations"
                mobileActions="all"
                actionButtons={[
                    <Button
                        key="new-org"
                        mode="contained"
                        compact
                        icon="plus"
                        onPress={() => setCreateOpen(true)}
                    >
                        {xl ? "New organization" : "New"}
                    </Button>,
                ]}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container} lightColor="transparent" darkColor="transparent">
                    <Text style={styles.subheading}>
                        An organization owns your brands and holds the plan & billing. Create
                        one to group brands and manage them together.
                    </Text>

                    {loading && organizations.length === 0 ? (
                        <ActivityIndicator style={styles.loader} color={colors.primary} />
                    ) : organizations.length === 0 ? (
                        <EmptyState
                            hideImage
                            hideAction
                            title="No organizations yet"
                            subtitle="Tap “New organization” to group and manage your brands together."
                        />
                    ) : (
                        organizations.map((org) => {
                            const count = org.brandIds?.length ?? 0;
                            return (
                                <EntityCard
                                    key={org.id}
                                    title={org.name}
                                    subtitle={`${count}/${org.maxBrands || 1} brand${count === 1 ? "" : "s"}`}
                                    onPress={() => openOrg(org.id)}
                                    trailing={<PlanUsageChip planKey={org.planKey} />}
                                />
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <NameInputModal
                visible={createOpen}
                title="Create organization"
                subtitle="An organization owns your brands and holds the plan & billing."
                label="Organization name"
                submitLabel="Create"
                loading={creating}
                onSubmit={handleCreate}
                onClose={() => setCreateOpen(false)}
            />
        </AppLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        scroll: {
            padding: 16,
            alignItems: xl ? "center" : "stretch",
        },
        container: {
            width: "100%",
            maxWidth: 1000,
            alignSelf: "center",
            gap: 12,
        },
        subheading: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        loader: {
            marginTop: 24,
        },
    });

export default OrganizationsScreen;
