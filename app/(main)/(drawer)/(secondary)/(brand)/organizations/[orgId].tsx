import BrandCard from "@/components/organization/BrandCard";
import ConfirmCreateBrandDialog from "@/components/organization/ConfirmCreateBrandDialog";
import ConfirmDeleteDialog from "@/components/organization/ConfirmDeleteDialog";
import ConfirmRemoveMemberDialog from "@/components/organization/ConfirmRemoveMemberDialog";
import EntityCard from "@/components/organization/EntityCard";
import MoveBrandDialog from "@/components/organization/MoveBrandDialog";
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
    const { xl, width } = useBreakpoints();
    const styles = useStyles(colors);
    const router = useRouter();

    const { orgId } = useLocalSearchParams<{ orgId: string }>();
    const {
        organizations,
        getOrganization,
        getOrganizationMembers,
        removeOrganizationMember,
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
    const [menuBrandId, setMenuBrandId] = useState<string | null>(null);
    // Header overflow menu — gathers the org-level actions (rename, billing,
    // delete) that used to be scattered across the header and a danger zone.
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

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

    // Drive the two-column split + brand-grid sizing off the constrained content
    // width. On xl the page splits 2/3 (brands) · 1/3 (members); on mobile it
    // stacks and the brand grid simply uses the full width.
    const COLUMN_GAP = 24;
    const GRID_GAP = 12;
    const layout = useMemo(() => {
        const content = width - 32; // 32 = scroll horizontal padding; full-width page
        const leftWidth = xl ? (content - COLUMN_GAP) * (2 / 3) : content;
        const rightWidth = xl ? (content - COLUMN_GAP) * (1 / 3) : content;
        // Width-driven column count: target ~175px squarish tiles so a full-width
        // page fills its horizontal space instead of stretching a few wide tiles.
        // Clamped to keep at least 2 columns and avoid splintering on ultra-wide.
        const cols = Math.max(2, Math.min(6, Math.floor(leftWidth / 175)));
        const brandCardWidth = Math.floor((leftWidth - GRID_GAP * (cols - 1)) / cols);
        return { leftWidth, rightWidth, brandCardWidth };
    }, [width, xl]);

    // Confirming brand creation no longer collects a name inline — it routes
    // into the onboarding flow, which captures the name + profile. The org id
    // is threaded through so the draft brand is created under this organization.
    const handleConfirmCreateBrand = () => {
        if (!orgId) return;
        setAddBrandOpen(false);
        router.push({ pathname: "/onboarding", params: { orgId } } as any);
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
        // router.replace("/");
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
        <AppLayout withWebPadding={false} safeAreaEdges={["right", "bottom", "left"]}>
            <PageHeader
                showBackButton
                mobileActions="all"
                title={detail?.organization.name || "Organization"}
                actionButtons={
                    detail
                        ? [
                            <Menu
                                key="org-actions"
                                visible={headerMenuOpen}
                                onDismiss={() => setHeaderMenuOpen(false)}
                                anchor={
                                    <IconButton
                                        icon="dots-horizontal"
                                        size={22}
                                        iconColor={colors.text}
                                        onPress={() => setHeaderMenuOpen(true)}
                                        style={styles.headerEditButton}
                                    />
                                }
                            >
                                <Menu.Item
                                    leadingIcon="pencil"
                                    title="Edit name"
                                    onPress={() => {
                                        setHeaderMenuOpen(false);
                                        setRenameOpen(true);
                                    }}
                                />
                                <Menu.Item
                                    leadingIcon="credit-card-outline"
                                    title="Billing"
                                    onPress={() => {
                                        setHeaderMenuOpen(false);
                                        router.push(`/billing/${orgId}`);
                                    }}
                                />
                                <Divider />
                                <Menu.Item
                                    leadingIcon="trash-can-outline"
                                    title="Delete organization"
                                    titleStyle={{ color: colors.red }}
                                    onPress={() => {
                                        setHeaderMenuOpen(false);
                                        setOrgDeleteOpen(true);
                                    }}
                                />
                            </Menu>,
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
                        <View
                            style={[styles.split, xl && styles.splitRow]}
                            lightColor="transparent"
                            darkColor="transparent"
                        >
                            {/* Left (2/3 on xl): brands as a squarish tile grid. */}
                            <View
                                style={[styles.column, xl && { width: layout.leftWidth }]}
                                lightColor="transparent"
                                darkColor="transparent"
                            >
                                <View style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                                    <View style={styles.sectionHeaderText}>
                                        <Text style={styles.sectionHeaderTitle}>Brands</Text>
                                        {atCap && (
                                            <Text style={styles.capWarning}>
                                                You've reached your plan's brand limit. Upgrade to add more.
                                            </Text>
                                        )}
                                    </View>
                                    <Button
                                        mode="contained"
                                        compact
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
                                    <View style={styles.brandGrid} lightColor="transparent" darkColor="transparent">
                                        {detail.brands.map((b) => (
                                            <BrandCard
                                                key={b.id}
                                                name={b.name}
                                                image={b.image}
                                                isCurrent={b.id === selectedBrand?.id}
                                                width={layout.brandCardWidth}
                                                onPress={() => openBrand(b.id)}
                                                menuOpen={menuBrandId === b.id}
                                                onOpenMenu={() => setMenuBrandId(b.id)}
                                                onDismissMenu={() => setMenuBrandId(null)}
                                                canMove={moveTargets.length > 0}
                                                onMove={() => {
                                                    setMenuBrandId(null);
                                                    setMoveBrandTarget({ id: b.id, name: b.name });
                                                }}
                                                onDelete={() => {
                                                    setMenuBrandId(null);
                                                    setBrandDeleteTarget({ id: b.id, name: b.name });
                                                }}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Right (1/3 on xl): members as compact rows. */}
                            <View
                                style={[styles.column, xl ? { width: layout.rightWidth } : styles.membersStacked]}
                                lightColor="transparent"
                                darkColor="transparent"
                            >
                                <View style={styles.sectionHeaderRow} lightColor="transparent" darkColor="transparent">
                                    <Text style={styles.sectionHeaderTitle}>Members</Text>
                                    <Button
                                        mode="text"
                                        compact
                                        textColor={colors.primary}
                                        onPress={() => router.push("/members")}
                                    >
                                        Manage
                                    </Button>
                                </View>
                                <Text style={styles.sectionHint}>
                                    Members join automatically when invited to one of this
                                    organization's brands. Invite people from a brand's User
                                    Management page.
                                </Text>

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
                            </View>
                        </View>
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

            <ConfirmCreateBrandDialog
                visible={addBrandOpen}
                organizationName={detail?.organization.name}
                onCancel={() => setAddBrandOpen(false)}
                onConfirm={handleConfirmCreateBrand}
            />
        </AppLayout>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        scroll: {
            padding: 16,
            alignItems: "stretch",
        },
        container: {
            width: "100%",
        },
        split: {
            gap: 32,
        },
        splitRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 24,
        },
        column: {
            flexShrink: 1,
            gap: 12,
        },
        membersStacked: {
            marginTop: 4,
        },
        headerEditButton: {
            margin: 0,
        },
        ctaButton: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.25,
            elevation: 4,
        },
        sectionHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minHeight: 40,
        },
        sectionHeaderText: {
            flex: 1,
            flexDirection: "column",
            gap: 6,
        },
        sectionHeaderTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        sectionHint: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
            marginTop: -4,
        },
        brandGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        capWarning: {
            fontSize: 13,
            color: colors.red,
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
