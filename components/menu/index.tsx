import { canAccessNav } from "@/constants/Access";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { truncateText } from "@/utils/text";
import { imageUrl } from "@/utils/url";
import {
    faAddressCard,
    faArrowLeft,
    faArrowTrendUp,
    faBell,
    faBriefcase,
    faBuilding,
    faBullhorn,
    faBullseye,
    faChartLine,
    faChevronRight,
    faComment,
    faCreditCard,
    faDiagramProject,
    faEye,
    faFileLines,
    faGears,
    faGem,
    faHandshake,
    faInbox,
    faLock,
    faPenToSquare,
    faPeopleGroup,
    faShareNodes,
    faStar,
    faTriangleExclamation,
    faUsers,
    faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme, type Theme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    BackHandler,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Text, View } from "../theme/Themed";
import Button from "../ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

type HubKey = "grow" | "influencer" | "manage" | "admin";

interface Item {
    id: string;
    icon: any;
    title: string;
    href: Href;
    /** Lock reason — when present, item renders disabled with this hint. */
    locked?: string;
    /** Pro lock — shows an upgrade pill instead of disabled hint. */
    pro?: boolean;
}

interface ItemGroup {
    title?: string;
    items: Item[];
}

interface Hub {
    key: HubKey;
    icon: any;
    title: string;
    subtitle: string;
    /** Hidden entirely when this returns false. */
    visible: boolean;
    groups: ItemGroup[];
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Mobile "My Brand" menu. Mirrors the web sidebar's structure (Create, Grow,
 * Manage, Admin) using a Hub home + drill-down pattern so the first screen
 * stays scannable.
 */
const Menu = () => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const router = useRouter();
    const { xl } = useBreakpoints();
    const { selectedBrand, hasFeature, hasPrivilege, isIndiaBased } = useBrandContext();
    const { manager } = useAuthContext();

    const [activeHub, setActiveHub] = useState<HubKey | null>(null);

    const chatLockReason = "Connect chat to unlock";
    const isChatConnected = !!manager?.isChatConnected;

    const hubs = useMemo<Hub[]>(() => {
        // Grow mirrors the web "Influencer Led Growth" sub-drawer plus the
        // direct Growth links — Discovery / Execution / Paid / Programs.
        // Discover + Collaboration Requests show for everyone. For non-India the
        // Discover route renders a managed-sourcing landing (Hire Us) instead of
        // the discovery grid, so it isn't gated behind Pro there.
        const discoveryItems: Item[] = [
            { id: "discover", icon: faGem, title: "Discover Influencers", href: "/discover", pro: isIndiaBased },
            { id: "collaborations", icon: faStar, title: "Collaboration Requests", href: "/collaborations" },
        ];

        const executionItems: Item[] = [
            { id: "messages", icon: faComment, title: "Messages", href: "/messages", locked: isChatConnected ? undefined : chatLockReason },
            { id: "contracts", icon: faFileLines, title: "Influencer Contracts", href: "/contracts", locked: isChatConnected ? undefined : chatLockReason },
        ];

        const grow: Hub = {
            key: "grow",
            icon: faArrowTrendUp,
            title: "Grow",
            subtitle: "Organic, Paid, Performance",
            visible: true,
            groups: [
                {
                    title: "Paid Growth",
                    items: [
                        { id: "analytics", icon: faChartLine, title: "Reporting & Analytics", href: "/analytics" },
                        { id: "organic-growth", icon: faArrowTrendUp, title: "Organic Conversions", href: "/organic-growth" },
                        { id: "paid-growth", icon: faBullseye, title: "Paid Mediums", href: "/paid-growth" },
                        { id: "performance-marketing", icon: faChartLine, title: "Performance Marketing", href: "/performance-marketing" },
                        { id: "hire-us", icon: faBriefcase, title: "Hire Us", href: "/hire-us" },
                    ],
                },
            ],
        };
        const influencer: Hub = {
            key: "influencer",
            icon: faPeopleGroup,
            title: "Influencer Led Campaigns",
            subtitle: "Influencers, campaigns, analytics",
            visible: true,
            groups: [
                ...(discoveryItems.length ? [{ title: "Discovery", items: discoveryItems }] : []),
                { title: "Execution", items: executionItems },
                {
                    title: "Programs",
                    items: [
                        { id: "affiliate-purchase", icon: faHandshake, title: "Affiliate Purchase", href: "/affiliate-purchase" },
                        { id: "partnership-ads", icon: faBullhorn, title: "Partnership Ads", href: "/partnership-ads" },
                    ],
                },
            ],
        };

        const manage: Hub = {
            key: "manage",
            icon: faGears,
            title: "Manage Brand",
            subtitle: "Profile, members, accounts",
            visible: true,
            groups: [
                {
                    items: [
                        { id: "brand-profile", icon: faAddressCard, title: "Brand Profile", href: "/brand-profile" },
                        { id: "connected-accounts", icon: faShareNodes, title: "Connected Accounts", href: "/connected-accounts" },
                        { id: "members", icon: faUsers, title: "Members", href: "/members" },
                        ...(Platform.OS === "web"
                            ? [{ id: "billing", icon: faCreditCard, title: "Billing", href: "/billing" as Href }]
                            : [{ id: "settings", icon: faGears, title: "Settings", href: "/settings" as Href }]),
                    ],
                },
            ],
        };

        const admin: Hub = {
            key: "admin",
            icon: faUserShield,
            title: "Admin Portal",
            subtitle: "Operations, CMS, escalations",
            visible: !!manager?.isAdmin,
            groups: [
                {
                    title: "Operations",
                    items: [
                        { id: "admin-invites", icon: faUserShield, title: "Invites Management", href: "/admin-invites" },
                        { id: "brand-crm", icon: faAddressCard, title: "Brands CRM", href: "/brand-crm" },
                    ],
                },
                {
                    title: "Content & Support",
                    items: [
                        { id: "collaboration-cms", icon: faDiagramProject, title: "Collaboration CMS", href: "/collaboration-cms" },
                        { id: "applications", icon: faEye, title: "All Applications", href: "/applications" },
                        { id: "admin-escalations", icon: faTriangleExclamation, title: "Escalations", href: "/admin-escalations" },
                    ],
                },
            ],
        };

        // Gate every entry by the member's team feature privileges. Drop empty
        // groups, then hide any hub left with no items (mixed hubs handled
        // per-item — e.g. Manage Brand mixes brand_admin + social_accounts).
        const gate = (href: string) => canAccessNav(href, hasFeature, hasPrivilege);
        return [grow, influencer, manage, admin]
            .map((h) => {
                const groups = h.groups
                    .map((g) => ({ ...g, items: g.items.filter((it) => gate(it.href as string)) }))
                    .filter((g) => g.items.length > 0);
                return { ...h, groups, visible: h.visible && groups.length > 0 };
            })
            .filter((h) => h.visible);
    }, [isIndiaBased, isChatConnected, manager?.isAdmin, hasFeature, hasPrivilege]);

    // Hardware back returns to the hub home when drilled in (Android).
    useEffect(() => {
        if (!activeHub || Platform.OS !== "android") return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            setActiveHub(null);
            return true;
        });
        return () => sub.remove();
    }, [activeHub]);

    const navigate = (href: Href) => {
        // @ts-ignore — Href union is wider than the typed routes
        router.push(href);
    };

    // ─── Drill-down: render a category screen ─────────────────────────────
    if (activeHub) {
        const hub = hubs.find((h) => h.key === activeHub);
        if (!hub) {
            // Hub was hidden after navigation — bail back to home.
            setActiveHub(null);
            return null;
        }
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.subScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    onPress={() => setActiveHub(null)}
                    style={styles.backRow}
                    accessibilityRole="button"
                    accessibilityLabel="Back to brand menu"
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        size={16}
                        color={Colors(theme).text}
                    />
                    <Text style={styles.backText}>Brand Menu</Text>
                </Pressable>

                <View style={styles.subHeader}>
                    <View style={styles.subHeaderIcon}>
                        <FontAwesomeIcon
                            icon={hub.icon}
                            size={20}
                            color={Colors(theme).white}
                        />
                    </View>
                    <View style={styles.subHeaderText}>
                        <Text style={styles.subHeaderTitle}>{hub.title}</Text>
                        <Text style={styles.subHeaderSubtitle}>{hub.subtitle}</Text>
                    </View>
                </View>

                {hub.groups.map((group, gi) => (
                    <View key={`${hub.key}-g-${gi}`} style={styles.group}>
                        {group.title && (
                            <Text style={styles.groupTitle}>{group.title}</Text>
                        )}
                        <View style={styles.groupItems}>
                            {group.items.map((item) => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    theme={theme}
                                    onPress={() => navigate(item.href)}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    }

    // ─── Hub home ──────────────────────────────────────────────────────────
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topRow}>
                <Image
                    source={imageUrl(selectedBrand?.image)}
                    style={styles.avatarBrandImage}
                />
                <Text style={styles.brandName}>{selectedBrand?.name}</Text>
                {selectedBrand?.profile?.about && (
                    <Text style={styles.brandAbout}>
                        {truncateText(selectedBrand?.profile?.about, 120)}
                    </Text>
                )}
                <Button
                    mode="contained"
                    style={styles.menuButton}
                    icon={() => (
                        <FontAwesomeIcon
                            icon={faPenToSquare}
                            size={14}
                            color={Colors(theme).white}
                        />
                    )}
                    onPress={() => router.push("/brand-profile")}
                >
                    Edit Brand
                </Button>
            </View>

            {/* Quick actions */}
            <View style={styles.quickRow}>
                <QuickChip
                    icon={faInbox}
                    label="Inbox"
                    theme={theme}
                    onPress={() => navigate("/inbox")}
                />
                <QuickChip
                    icon={faComment}
                    label="Messages"
                    theme={theme}
                    onPress={() => navigate("/messages")}
                />
                <QuickChip
                    icon={faBell}
                    label="Alerts"
                    theme={theme}
                    onPress={() => navigate("/notifications")}
                />
            </View>

            {/* Hub cards */}
            <View style={styles.hubGrid}>
                {hubs.map((hub) => (
                    <HubCard
                        key={hub.key}
                        hub={hub}
                        theme={theme}
                        onPress={() => setActiveHub(hub.key)}
                    />
                ))}
            </View>

            {/* Organizations row */}
            <Pressable
                onPress={() => navigate("/organizations")}
                style={({ pressed }) => [
                    styles.orgRow,
                    pressed && styles.orgRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Organizations"
            >
                <View style={styles.orgIcon}>
                    <FontAwesomeIcon
                        icon={faBuilding}
                        size={18}
                        color={Colors(theme).primary}
                    />
                </View>
                <View style={styles.orgText}>
                    <Text style={styles.orgTitle}>Organizations</Text>
                    <Text style={styles.orgSubtitle} numberOfLines={1}>
                        Switch or manage your organizations
                    </Text>
                </View>
                <FontAwesomeIcon
                    icon={faChevronRight}
                    size={14}
                    color={Colors(theme).textSecondary}
                />
            </Pressable>
        </ScrollView>
    );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const QuickChip: React.FC<{
    icon: any;
    label: string;
    theme: Theme;
    onPress: () => void;
}> = ({ icon, label, theme, onPress }) => {
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.quickChip,
                pressed && styles.quickChipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <FontAwesomeIcon
                icon={icon}
                size={18}
                color={Colors(theme).primary}
            />
            <Text style={styles.quickChipText}>{label}</Text>
        </Pressable>
    );
};

const HubCard: React.FC<{ hub: Hub; theme: Theme; onPress: () => void }> = ({
    hub,
    theme,
    onPress,
}) => {
    const styles = useMemo(() => createStyles(theme), [theme]);
    const colors = Colors(theme);
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.hubCard,
                pressed && styles.hubCardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${hub.title}. ${hub.subtitle}`}
        >
            <LinearGradient
                colors={[colors.primary, colors.primaryMid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hubIcon}
            >
                <FontAwesomeIcon icon={hub.icon} size={20} color={colors.white} />
            </LinearGradient>
            <View style={styles.hubText}>
                <Text style={styles.hubTitle}>{hub.title}</Text>
                <Text style={styles.hubSubtitle} numberOfLines={1}>
                    {hub.subtitle}
                </Text>
            </View>
            <FontAwesomeIcon
                icon={faChevronRight}
                size={14}
                color={colors.textSecondary}
            />
        </Pressable>
    );
};

const ItemRow: React.FC<{
    item: Item;
    theme: Theme;
    onPress: () => void;
}> = ({ item, theme, onPress }) => {
    const styles = useMemo(() => createStyles(theme), [theme]);
    const colors = Colors(theme);
    const disabled = !!item.locked;
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            style={({ pressed }) => [
                styles.itemRow,
                pressed && !disabled && styles.itemRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityState={{ disabled }}
        >
            <View style={[styles.itemIcon, disabled && styles.itemIconDisabled]}>
                <FontAwesomeIcon
                    icon={item.icon}
                    size={16}
                    color={
                        disabled
                            ? colors.textSecondary
                            : theme.dark
                                ? colors.text
                                : colors.primary
                    }
                />
            </View>
            <View style={styles.itemText}>
                <Text
                    style={[
                        styles.itemTitle,
                        disabled && styles.itemTitleDisabled,
                    ]}
                >
                    {item.title}
                </Text>
                {disabled && (
                    <Text style={styles.itemLockReason}>{item.locked}</Text>
                )}
            </View>
            {item.pro ? (
                <View style={styles.proPill}>
                    <FontAwesomeIcon icon={faLock} size={9} color={colors.text} />
                    <Text style={styles.proPillText}>Pro</Text>
                </View>
            ) : disabled ? (
                <FontAwesomeIcon
                    icon={faLock}
                    size={12}
                    color={colors.textSecondary}
                />
            ) : (
                <FontAwesomeIcon
                    icon={faChevronRight}
                    size={14}
                    color={colors.textSecondary}
                />
            )}
        </Pressable>
    );
};

export default Menu;

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 20,
        },
        subScrollContent: {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 16,
        },
        // ── Hub home: hero ────────────────────────────────────────────────
        topRow: {
            gap: 16,
            alignItems: "center",
            paddingTop: 20,
        },
        brandName: {
            fontSize: 24,
            textAlign: "center",
            color: colors.text,
        },
        brandAbout: {
            fontSize: 16,
            textAlign: "center",
            color: colors.gray100,
        },
        avatarBrandImage: {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            width: 140,
            height: 140,
            borderRadius: 20,
        },
        menuButton: {
            backgroundColor: colors.primary,
        },
        // ── Quick chips row ───────────────────────────────────────────────
        quickRow: {
            flexDirection: "row",
            gap: 10,
        },
        quickChip: {
            flex: 1,
            backgroundColor: colors.tag,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 10,
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        quickChipPressed: {
            opacity: 0.7,
        },
        quickChipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
        },
        // ── Hub cards ─────────────────────────────────────────────────────
        hubGrid: {
            gap: 12,
        },
        hubCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        hubCardPressed: {
            opacity: 0.85,
        },
        hubIcon: {
            width: 46,
            height: 46,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
            shadowOpacity: 0.3,
            elevation: 4,
        },
        hubText: {
            flex: 1,
            gap: 2,
        },
        hubTitle: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: -0.2,
        },
        hubSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        // ── Organizations row ─────────────────────────────────────────────
        orgRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: colors.tag,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginTop: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        orgRowPressed: {
            opacity: 0.85,
        },
        orgIcon: {
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        orgText: {
            flex: 1,
            gap: 2,
            backgroundColor: "transparent",
        },
        orgTitle: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
            letterSpacing: -0.1,
        },
        orgSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        // ── Drill-down ────────────────────────────────────────────────────
        backRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 8,
        },
        backText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        subHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingTop: 4,
            paddingBottom: 4,
        },
        subHeaderIcon: {
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
            shadowOpacity: 0.3,
            elevation: 4,
        },
        subHeaderText: {
            flex: 1,
            gap: 2,
        },
        subHeaderTitle: {
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: -0.4,
        },
        subHeaderSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
        },
        group: {
            gap: 6,
        },
        groupTitle: {
            fontSize: 11,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.9,
            color: colors.textSecondary,
            paddingHorizontal: 4,
        },
        groupItems: {
            backgroundColor: colors.card,
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 4,
            shadowOpacity: 0.05,
            elevation: 2,
        },
        itemRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
        },
        itemRowPressed: {
            backgroundColor: colors.tag,
        },
        itemIcon: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        itemIconDisabled: {
            opacity: 0.6,
        },
        itemText: {
            flex: 1,
            gap: 2,
        },
        itemTitle: {
            fontSize: 15,
            fontWeight: "500",
            color: colors.text,
        },
        itemTitleDisabled: {
            color: colors.textSecondary,
        },
        itemLockReason: {
            fontSize: 11,
            color: colors.textSecondary,
            fontStyle: "italic",
        },
        proPill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.tag,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
        },
        proPillText: {
            fontSize: 10,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: 0.3,
        },
    });
};
