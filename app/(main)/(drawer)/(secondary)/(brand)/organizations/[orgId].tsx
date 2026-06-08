import ConfirmDeleteDialog from "@/components/organization/ConfirmDeleteDialog";
import ConfirmRemoveMemberDialog from "@/components/organization/ConfirmRemoveMemberDialog";
import EntityCard from "@/components/organization/EntityCard";
import MoveBrandDialog from "@/components/organization/MoveBrandDialog";
import NameInputModal from "@/components/organization/NameInputModal";
import RenameDialog from "@/components/organization/RenameDialog";
import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import Tag from "@/components/ui/tag";
import { useAuthContext } from "@/contexts/auth-context.provider";
import { useBrandContext } from "@/contexts/brand-context.provider";
import {
    OrganizationDetail,
    OrganizationMemberRow,
    useOrganizationContext,
} from "@/contexts/organization-context.provider";
import { useBreakpoints } from "@/hooks";
import AppLayout from "@/layouts/app-layout";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Divider, IconButton, Menu } from "react-native-paper";

const ManageOrganizationScreen = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);
    const router = useRouter();

    const { orgId } = useLocalSearchParams<{ orgId: string }>();
    const {
        organizations,
        getOrganization,
        getOrganizationMembers,
        removeOrganizationMember,
        addBrand,
        transferBrand,
        deleteBrand,
        deleteOrganization,
        renameOrganization,
    } = useOrganizationContext();
    const { brands, selectedBrand, setSelectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const [detail, setDetail] = useState<OrganizationDetail | null>(null);
    const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [addBrandOpen, setAddBrandOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [menuBrandId, setMenuBrandId] = useState<string | null>(null);

    // One destructive-confirmation pattern for both brand + org deletes.
    const [brandDeleteTarget, setBrandDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deletingBrand, setDeletingBrand] = useState(false);
    const [orgDeleteOpen, setOrgDeleteOpen] = useState(false);
    const [deletingOrg, setDeletingOrg] = useState(false);

    // Org-member removal (strips the member from every brand in the org).
    const [memberRemoveTarget, setMemberRemoveTarget] = useState<OrganizationMemberRow | null>(null);
    const [removingMember, setRemovingMember] = useState(false);

    // Move-brand modal — a single deliberate action (target org + acknowledgement).
    const [moveBrandTarget, setMoveBrandTarget] = useState<{ id: string; name: string } | null>(null);
    const [movingBrand, setMovingBrand] = useState(false);
    // Rename-org modal.
    const [renameOpen, setRenameOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);

    const load = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        const [d, m] = await Promise.all([
            getOrganization(orgId),
            getOrganizationMembers(orgId),
        ]);
        setDetail(d);
        setMembers(m);
        setLoading(false);
    }, [orgId, getOrganization, getOrganizationMembers]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const atCap = !!detail && detail.brandCount >= detail.maxBrands;
    const moveTargets = organizations.filter((o) => o.id !== orgId);

    // Only an org owner/admin may remove members. Derive the viewer's role from
    // the loaded member list.
    const viewerRole = members.find((m) => m.managerId === manager?.id)?.role;
    const canManageMembers = viewerRole === "org_owner" || viewerRole === "org_admin";

    const roleLabel = (role: OrganizationMemberRow["role"]) =>
        role === "org_owner" ? "Owner" : role === "org_admin" ? "Admin" : "Member";

    const handleAddBrand = async (name: string) => {
        if (!name || !orgId) return;
        setBusy(true);
        const id = await addBrand(orgId, name);
        setBusy(false);
        if (id) {
            setAddBrandOpen(false);
            load();
        }
    };

    // Switch the active brand to the tapped one and enter the app. Only brands
    // the user is a member of are in `brands` — guard against the rest.
    const openBrand = (brandId: string) => {
        const full = brands.find((x) => x.id === brandId);
        if (!full) {
            Toaster.error("You don't have access to open this brand yet.");
            return;
        }
        setSelectedBrand(full, true);
        router.replace("/");
    };

    const doMoveBrand = async (destOrgId: string) => {
        if (!moveBrandTarget) return;
        setMovingBrand(true);
        const ok = await transferBrand(destOrgId, moveBrandTarget.id);
        setMovingBrand(false);
        if (ok) {
            setMoveBrandTarget(null);
            load();
        }
    };

    const doRename = async (name: string) => {
        if (!orgId) return;
        setRenaming(true);
        const ok = await renameOrganization(orgId, name);
        setRenaming(false);
        if (ok) {
            setRenameOpen(false);
            load();
        }
    };

    const doDeleteBrand = async () => {
        if (!brandDeleteTarget) return;
        setDeletingBrand(true);
        const ok = await deleteBrand(brandDeleteTarget.id);
        setDeletingBrand(false);
        if (ok) {
            setBrandDeleteTarget(null);
            load();
        }
    };

    const doDeleteOrg = async () => {
        if (!orgId) return;
        setDeletingOrg(true);
        const ok = await deleteOrganization(orgId);
        setDeletingOrg(false);
        if (ok) {
            setOrgDeleteOpen(false);
            router.back();
        }
    };

    const doRemoveMember = async () => {
        if (!orgId || !memberRemoveTarget) return;
        setRemovingMember(true);
        const ok = await removeOrganizationMember(orgId, memberRemoveTarget.managerId);
        setRemovingMember(false);
        if (ok) {
            setMemberRemoveTarget(null);
            load();
        }
    };

    return (
        <AppLayout withWebPadding={false} safeAreaEdges={["top", "right", "bottom", "left"]}>
            <PageHeader
                showBackButton
                mobileActions="all"
                title={detail?.organization.name || "Organization"}
                actionButtons={
                    detail
                        ? [
                            detail && (
                                <IconButton
                                    icon="pencil"
                                    size={18}
                                    iconColor={colors.textSecondary}
                                    onPress={() => setRenameOpen(true)}
                                    style={styles.headerEditButton}
                                />
                            ),
                            <Button
                                key="billing"
                                mode="text"
                                compact
                                icon="credit-card-outline"
                                textColor={colors.primary}
                                onPress={() => router.push(`/billing/${orgId}`)}
                            >
                                Billing
                            </Button>
                        ]
                        : []
                }
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.container} lightColor="transparent" darkColor="transparent">
                    {loading && !detail ? (
                        <ActivityIndicator style={styles.loader} color={colors.primary} />
                    ) : !detail ? (
                        <Text style={styles.empty}>Organization not found.</Text>
                    ) : (
                        <>
                            <View style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                                <View style={{ flex: 1, flexDirection: "column", gap: 8 }}>
                                    <Text style={styles.sectionHeaderTitle}>Brands</Text>
                                    {atCap &&
                                        <Text style={styles.capWarning}>
                                            You've reached your plan's brand limit. Upgrade to add more.
                                        </Text>}
                                </View>
                                <Button
                                    mode="contained"
                                    icon={atCap ? "arrow-up-bold" : "plus"}
                                    style={styles.ctaButton}
                                    onPress={() =>
                                        atCap
                                            ? router.push(`/billing/${orgId}`)
                                            : setAddBrandOpen(true)
                                    }
                                >
                                    {atCap ? "Upgrade plan" : "Add brand"}
                                </Button>
                            </View>
                            {detail.brands.length === 0 ? (
                                <Text style={styles.empty}>
                                    No brands in this organization yet.
                                </Text>
                            ) : (
                                detail.brands.map((b) => {
                                    const isCurrent = b.id === selectedBrand?.id;
                                    return (
                                        <EntityCard
                                            key={b.id}
                                            title={b.name}
                                            subtitle={isCurrent ? "Active brand" : "Tap to open"}
                                            onPress={() => openBrand(b.id)}
                                            trailing={
                                                <>
                                                    {isCurrent && <Tag compact>Current</Tag>}
                                                    <Menu
                                                        visible={menuBrandId === b.id}
                                                        onDismiss={() => setMenuBrandId(null)}
                                                        anchor={
                                                            <IconButton
                                                                icon="dots-vertical"
                                                                size={20}
                                                                iconColor={colors.text}
                                                                onPress={() => setMenuBrandId(b.id)}
                                                            />
                                                        }
                                                    >
                                                        <Menu.Item
                                                            title="Move to another organization"
                                                            disabled={moveTargets.length === 0}
                                                            onPress={() => {
                                                                setMenuBrandId(null);
                                                                setMoveBrandTarget({ id: b.id, name: b.name });
                                                            }}
                                                        />
                                                        <Divider />
                                                        <Menu.Item
                                                            title="Delete"
                                                            titleStyle={{ color: colors.red }}
                                                            onPress={() => {
                                                                setMenuBrandId(null);
                                                                setBrandDeleteTarget({ id: b.id, name: b.name });
                                                            }}
                                                        />
                                                    </Menu>
                                                </>
                                            }
                                        />
                                    );
                                })
                            )}

                            <View
                                style={styles.membersHeaderRow}
                                lightColor="transparent"
                                darkColor="transparent"
                            >
                                <View style={{ flex: 1, flexDirection: "column", gap: 8 }}>
                                    <Text style={styles.sectionHeaderTitle}>Members</Text>
                                    <Text style={styles.sectionHint}>
                                        Members join this organization automatically when they're
                                        invited to one of its brands. To add someone, invite them from
                                        a brand's User Management page.
                                    </Text>
                                </View>
                                <Button
                                    mode="text"
                                    compact
                                    textColor={colors.primary}
                                    onPress={() => router.push("/members")}
                                >
                                    Go to User Management
                                </Button>
                            </View>

                            {members.length === 0 ? (
                                <Text style={styles.empty}>No members yet.</Text>
                            ) : (
                                members.map((m) => {
                                    const display = m.name || m.email || "Member";
                                    const canRemove =
                                        canManageMembers &&
                                        m.role !== "org_owner" &&
                                        m.managerId !== manager?.id;
                                    return (
                                        <EntityCard
                                            key={m.managerId}
                                            title={display}
                                            subtitle={m.name ? m.email : undefined}
                                            trailing={
                                                <>
                                                    <Tag compact>{roleLabel(m.role)}</Tag>
                                                    {canRemove && (
                                                        <IconButton
                                                            icon="account-remove-outline"
                                                            size={20}
                                                            iconColor={colors.red}
                                                            onPress={() => setMemberRemoveTarget(m)}
                                                        />
                                                    )}
                                                </>
                                            }
                                        />
                                    );
                                })
                            )}

                            <View style={styles.dangerZone} lightColor="transparent" darkColor="transparent">
                                <Button
                                    mode="outlined"
                                    textColor={colors.red}
                                    onPress={() => setOrgDeleteOpen(true)}
                                >
                                    Delete organization
                                </Button>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            <ConfirmDeleteDialog
                visible={!!brandDeleteTarget}
                title={`Delete ${brandDeleteTarget?.name ?? "brand"}?`}
                warning="This permanently deletes the brand and everything inside it — members, teams, socials, content, strategies, analytics, inbox, and notifications. This action is unrecoverable."
                confirmWord={brandDeleteTarget?.name}
                loading={deletingBrand}
                onCancel={() => setBrandDeleteTarget(null)}
                onConfirm={doDeleteBrand}
            />

            <ConfirmDeleteDialog
                visible={orgDeleteOpen}
                title={`Delete ${detail?.organization.name ?? "organization"}?`}
                warning="You must move or delete all its brands and cancel any paid plan first. This permanently deletes the organization and cannot be undone."
                confirmWord={detail?.organization.name}
                loading={deletingOrg}
                onCancel={() => setOrgDeleteOpen(false)}
                onConfirm={doDeleteOrg}
            />

            <ConfirmRemoveMemberDialog
                visible={!!memberRemoveTarget}
                memberName={
                    memberRemoveTarget?.name || memberRemoveTarget?.email || "this member"
                }
                loading={removingMember}
                onCancel={() => setMemberRemoveTarget(null)}
                onConfirm={doRemoveMember}
            />

            <MoveBrandDialog
                visible={!!moveBrandTarget}
                brandName={moveBrandTarget?.name ?? ""}
                targets={moveTargets.map((o) => ({ id: o.id, name: o.name }))}
                loading={movingBrand}
                onCancel={() => setMoveBrandTarget(null)}
                onConfirm={doMoveBrand}
            />

            <RenameDialog
                visible={renameOpen}
                initialName={detail?.organization.name ?? ""}
                loading={renaming}
                onCancel={() => setRenameOpen(false)}
                onConfirm={doRename}
            />

            <NameInputModal
                visible={addBrandOpen}
                title="Add a brand"
                subtitle={`Create a new brand in ${detail?.organization.name ?? "this organization"}.`}
                label="Brand name"
                submitLabel="Add brand"
                loading={busy}
                onSubmit={handleAddBrand}
                onClose={() => setAddBrandOpen(false)}
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
        headerMain: {
            flex: 1,
            minWidth: 0,
        },
        headerTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
        },
        headerTitleText: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
            flexShrink: 1,
        },
        headerEditButton: {
            margin: 0,
        },
        headerSubtitle: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            letterSpacing: 1,
            marginTop: 2,
        },
        ctaButton: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.25,
            elevation: 4,
        },
        membersHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 36,
        },
        sectionHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
        },
        sectionHeaderTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        capWarning: {
            fontSize: 13,
            color: colors.red,
        },
        dangerZone: {
            marginTop: 32,
        },
        empty: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        loader: {
            marginTop: 24,
        },
    });

export default ManageOrganizationScreen;
