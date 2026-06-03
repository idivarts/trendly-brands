import { SidebarCollapsedContext, useSidebarCollapsed } from "@/components/drawer-layout/sidebar-collapsed-context";
import { Text, View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import ImageComponent from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import { faFileLines } from "@fortawesome/free-regular-svg-icons";
import {
    faArrowTrendUp,
    faBuilding,
    faBullseye,
    faCalendarDays,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCreditCard,
    faInbox,
    faLayerGroup,
    faPenRuler,
    faPlus,
    faShareNodes,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Linking,
    Platform,
    Pressable,
    View as RNView,
    ScrollView,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CreditDisplayCard from "./CreditDisplayCard";
import { DrawerColorsContext } from "./drawer-colors-context";
import DrawerMenuItem, { DrawerIcon, Tab } from "./DrawerMenuItem";
import { AdminPortal, AdminPortalSubDrawer } from "./admin-portal";
import { InfluencerLedGrowth, InfluencerLedGrowthSubDrawer } from "./influencer-led-growth";

// ─── Width constants (kept in sync with _layout.tsx) ───────────────────────
const COLLAPSED_WIDTH = 56;

// ─── Menu item factories ────────────────────────────────────────────────────

const BOTTOM_MENU_ITEMS = (
    theme: Theme,
    name?: string,
    profileImage?: string,
    styles?: { profileImageSize: { width: number; height: number } }
): Tab[] => [
        {
            href: "/onboarding-your-brand",
            icon: ({ focused }) => <DrawerIcon href="/onboarding-your-brand" icon={faPlus} focused={focused} />,
            label: "Create New Brand",
        },
        {
            href: "/profile",
            icon: () => (
                <ImageComponent
                    url={profileImage || ""}
                    initials={name}
                    shape="circle"
                    size="small"
                    altText="Image"
                    initialsSize={12}
                    style={styles?.profileImageSize}
                />
            ),
            label: name || "Profile",
        },
    ];

const CONTENT_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/content-strategies",
        icon: ({ focused }) => <DrawerIcon href="/content-strategies" icon={faPenRuler} focused={focused} />,
        label: "Content Strategy",
    },
    {
        href: "/content-calendar",
        icon: ({ focused }) => <DrawerIcon href="/content-calendar" icon={faCalendarDays} focused={focused} />,
        label: "Content Calendar",
    },
    {
        href: "/contents",
        icon: ({ focused }) => <DrawerIcon href="/contents" icon={faLayerGroup} focused={focused} />,
        label: "All Content",
    },
];

const MANAGE_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/connected-accounts",
        icon: ({ focused }) => <DrawerIcon href="/connected-accounts" icon={faShareNodes} focused={focused} />,
        label: "Connected Accounts",
    },
    {
        href: "/inbox",
        icon: ({ focused }) => <DrawerIcon href="/inbox" icon={faInbox} focused={focused} />,
        label: "Inbox",
    },
];

const BRAND_DETAILS_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/billing",
        icon: ({ focused }) => <DrawerIcon href="" icon={faCreditCard} focused={focused} />,
        label: "Billing",
    },
    {
        href: "/members",
        icon: ({ focused }) => <DrawerIcon href="" icon={faUsers} focused={focused} />,
        label: "User Management",
    },
    {
        href: "/brand-profile",
        icon: ({ focused }) => <DrawerIcon href="" icon={faFileLines} focused={focused} />,
        label: "Brand Profile",
    },
];

const GROWTH_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/organic-growth",
        icon: ({ focused }) => <DrawerIcon href="/organic-growth" icon={faArrowTrendUp} focused={focused} />,
        label: "Organic Conversions",
    },
    {
        href: "/paid-growth",
        icon: ({ focused }) => <DrawerIcon href="/paid-growth" icon={faBullseye} focused={focused} />,
        label: "Paid Mediums",
    },
    // {
    //     href: "/performance-marketing",
    //     icon: ({ focused }) => <DrawerIcon href="/performance-marketing" icon={faChartLine} focused={focused} />,
    //     label: "Performance Marketing",
    // },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface DrawerMenuContentWebProps { }

const DrawerMenuContentWeb: React.FC<DrawerMenuContentWebProps> = () => {
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme, bottom), [theme, bottom]);
    const { selectedBrand, brands, setSelectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const { xl } = useBreakpoints();
    const sidebarCollapsedCtx = useSidebarCollapsed();
    const { isCollapsed, toggle } = sidebarCollapsedCtx;

    const planKey = selectedBrand?.billing?.planKey || "";
    const hasMultipleBrands = brands.length > 1;

    const drawerColors = useMemo(
        () =>
            theme.dark
                ? {
                    inactiveColor: (colors as any).drawerTextMuted ?? colors.text,
                    activeColor: colors.drawerText,
                    inactiveBg: "transparent",
                }
                : {
                    inactiveColor: (colors as any).drawerTextMuted ?? "#506878",
                    activeColor: colors.primary,
                    inactiveBg: "transparent",
                },
        [theme.dark, colors.primary, colors.drawerText, (colors as any).drawerTextMuted]
    );

    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isGrowthHovered, setIsGrowthHovered] = useState(false);
    const [brandListExpanded, setBrandListExpanded] = useState(false);
    const [toggleHovered, setToggleHovered] = useState(false);
    const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
    const [isOrgHovered, setIsOrgHovered] = useState(false);

    const showCreditsSystem = false;

    const handleBrandSelect = (brand: Brand) => {
        setSelectedBrand(brand);
        setBrandListExpanded(false);
    };

    const contentItems = useMemo(() => CONTENT_MENU_ITEMS(theme), [theme]);

    // ─── Toggle button (bare Pressable, positioned by caller) ──────────────
    const toggleButtonBare = (
        <Pressable
            onPress={toggle}
            onHoverIn={() => setToggleHovered(true)}
            onHoverOut={() => setToggleHovered(false)}
            style={[
                styles.toggleButton,
                toggleHovered && styles.toggleButtonHover,
            ]}
            accessibilityLabel={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            accessibilityRole="button"
        >
            <FontAwesomeIcon
                icon={isCollapsed ? faChevronRight : faChevronLeft}
                size={12}
                color={(colors as any).drawerTextMuted ?? colors.textSecondary}
            />
        </Pressable>
    );

    // ─── Collapsed-mode toggle row (standalone, centered) ───────────────────
    const toggleButtonCollapsed = (
        <RNView style={[styles.toggleRow, styles.toggleRowCollapsed]}>
            {toggleButtonBare}
        </RNView>
    );

    // ─── Collapsed mode render ──────────────────────────────────────────────
    if (isCollapsed) {
        // Gather all visible sections as flat groups for the collapsed view
        const groups: { items: Tab[]; proLockMap?: Record<number, boolean> }[] = [
            { items: contentItems },
            { items: MANAGE_MENU_ITEMS(theme) },
            { items: GROWTH_MENU_ITEMS(theme) },
        ];

        const sidebarDividerColor = theme.dark
            ? "rgba(83, 139, 166, 0.12)"
            : "rgba(5, 68, 99, 0.08)";

        return (
            <DrawerColorsContext.Provider value={drawerColors}>
                <RNView style={styles.collapsedWrapper}>
                    <View style={[styles.root, styles.rootCollapsed]}>
                        {/* Gradient accent top line */}
                        <LinearGradient
                            colors={["#054463", "#538BA6", "#ff6d2d"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.accentLine}
                            pointerEvents="none"
                        />

                        {/* Toggle button — centered in collapsed bar */}
                        {toggleButtonCollapsed}

                        {/* Brand logo only */}
                        <RNView style={styles.collapsedHeader}>
                            <ImageComponent
                                url={selectedBrand?.image || ""}
                                initials={selectedBrand?.name?.[0] ?? ""}
                                shape="circle"
                                size="small"
                                altText={selectedBrand?.name || "Brand"}
                                style={styles.logoCircle}
                            />
                        </RNView>

                        {/* All menu items — icon only, scrollable */}
                        <ScrollView
                            contentContainerStyle={styles.collapsedScrollContent}
                            showsVerticalScrollIndicator={false}
                            // Allow tooltip views to overflow on web
                            style={Platform.OS === "web" ? ({ overflow: "visible" } as any) : undefined}
                        >
                            {groups.map((group, gIdx) => (
                                <RNView key={gIdx}>
                                    {gIdx > 0 && (
                                        <RNView
                                            style={[
                                                styles.collapsedDivider,
                                                { borderTopColor: sidebarDividerColor },
                                            ]}
                                        />
                                    )}
                                    {group.items.map((tab, idx) => (
                                        <DrawerMenuItem
                                            key={`${gIdx}-${idx}`}
                                            tab={tab}
                                            proLock={group.proLockMap?.[idx]}
                                        />
                                    ))}
                                </RNView>
                            ))}

                            {/* Influencer Led Growth — opens the sub-drawer */}
                            <RNView
                                style={[
                                    styles.collapsedDivider,
                                    { borderTopColor: sidebarDividerColor },
                                ]}
                            />
                            <InfluencerLedGrowth variant="rail" />

                            {/* Admin Portal — opens the sub-drawer */}
                            {manager?.isAdmin && (
                                <>
                                    <RNView
                                        style={[
                                            styles.collapsedDivider,
                                            { borderTopColor: sidebarDividerColor },
                                        ]}
                                    />
                                    <AdminPortal variant="rail" />
                                </>
                            )}
                        </ScrollView>

                        {/* Bottom actions — collapsed: single org button with popover */}
                        <LinearGradient
                            colors={
                                theme.dark
                                    ? [
                                          "transparent",
                                          (colors as any).drawerHeaderCardBg ?? colors.card,
                                      ]
                                    : [
                                          "transparent",
                                          (colors as any).drawerHeaderCardBgLight ?? "#E9F1F7",
                                      ]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[styles.bottomActions, styles.bottomActionsCollapsed]}
                        >
                            <RNView style={styles.collapsedOrgWrap}>
                                <Pressable
                                    onPress={() => setOrgDropdownOpen((v) => !v)}
                                    onHoverIn={() => setIsOrgHovered(true)}
                                    onHoverOut={() => setIsOrgHovered(false)}
                                    style={[
                                        styles.collapsedOrgButton,
                                        (isOrgHovered || orgDropdownOpen) &&
                                            styles.collapsedOrgButtonHover,
                                    ]}
                                    accessibilityRole="button"
                                    accessibilityLabel="Organization menu"
                                >
                                    <RNView style={styles.orgIconCircle}>
                                        <FontAwesomeIcon
                                            icon={faBuilding}
                                            size={14}
                                            color={colors.white}
                                        />
                                    </RNView>
                                    <RNView style={styles.collapsedPresenceDot} />
                                </Pressable>

                                {orgDropdownOpen && (
                                    <SidebarCollapsedContext.Provider
                                        value={{
                                            ...sidebarCollapsedCtx,
                                            isCollapsed: false,
                                        }}
                                    >
                                        <RNView style={styles.collapsedOrgPopover}>
                                            <Text
                                                style={styles.collapsedOrgPopoverHeader}
                                                numberOfLines={1}
                                            >
                                                {selectedBrand?.name ?? "Brand"}
                                            </Text>
                                            <RNView style={styles.orgDropdownDivider} />
                                            {BRAND_DETAILS_MENU_ITEMS(theme).map((tab, idx) => (
                                                <RNView
                                                    key={`c-org-brand-${idx}`}
                                                    onTouchEnd={() => setOrgDropdownOpen(false)}
                                                >
                                                    <DrawerMenuItem tab={tab} />
                                                </RNView>
                                            ))}
                                            <RNView style={styles.orgDropdownDivider} />
                                            <RNView onTouchEnd={() => setOrgDropdownOpen(false)}>
                                                <DrawerMenuItem
                                                    tab={{
                                                        href: "/onboarding-your-brand",
                                                        icon: ({ focused }) => (
                                                            <DrawerIcon
                                                                href="/onboarding-your-brand"
                                                                icon={faPlus}
                                                                focused={focused}
                                                            />
                                                        ),
                                                        label: "Create New Brand",
                                                    }}
                                                />
                                            </RNView>
                                            <RNView style={styles.orgDropdownDivider} />
                                            {BOTTOM_MENU_ITEMS(
                                                theme,
                                                manager?.name,
                                                manager?.profileImage,
                                                styles
                                            )
                                                .filter(
                                                    (tab) =>
                                                        tab.href !== "/onboarding-your-brand"
                                                )
                                                .map((tab, idx) => (
                                                    <RNView
                                                        key={`c-org-profile-${idx}`}
                                                        onTouchEnd={() =>
                                                            setOrgDropdownOpen(false)
                                                        }
                                                    >
                                                            <DrawerMenuItem tab={tab} />
                                                    </RNView>
                                                ))}
                                        </RNView>
                                    </SidebarCollapsedContext.Provider>
                                )}
                            </RNView>
                        </LinearGradient>
                    </View>

                    {/* Sub-drawers — sit beside the rail and reserve real layout
                    width so page content is pushed over, not hidden underneath.
                    Only one renders at a time based on subDrawerKind. */}
                    <InfluencerLedGrowthSubDrawer />
                    <AdminPortalSubDrawer />
                </RNView>
            </DrawerColorsContext.Provider>
        );
    }

    // ─── Expanded mode render (existing layout) ─────────────────────────────
    const headerGradientColors: [string, string] = theme.dark
        ? [(colors as any).drawerHeaderCardBg ?? colors.primary, (colors as any).drawerCardBg ?? colors.card]
        : [(colors as any).drawerHeaderCardBg ?? "#ffffff", (colors as any).drawerHeaderCardBgLight ?? "#E9F1F7"];

    const brandHeaderContent = (
        <LinearGradient
            colors={headerGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
        >
            {xl ? (
                <CoachmarkAnchor id="guide-tour-brand-switcher-web" shape="rect">
                    <Pressable
                        onPress={() => hasMultipleBrands && setBrandListExpanded((v) => !v)}
                        style={styles.headerPressable}
                    >
                        <View style={styles.headerRow}>
                            <ImageComponent
                                url={selectedBrand?.image || ""}
                                initials={selectedBrand?.name?.[0] ?? ""}
                                shape="circle"
                                size="small"
                                altText={selectedBrand?.name || "Brand"}
                                style={styles.logoCircle}
                            />
                            <View style={styles.headerBrand}>
                                <Text style={styles.brandName} numberOfLines={1}>
                                    {selectedBrand?.name ?? "Brand"}
                                </Text>
                                <Text style={styles.brandSubtitle}>Brand Portal</Text>
                            </View>
                            {hasMultipleBrands ? (
                                <FontAwesomeIcon
                                    icon={brandListExpanded ? faChevronUp : faChevronDown}
                                    size={14}
                                    color={colors.drawerTextMuted}
                                />
                            ) : null}
                        </View>
                    </Pressable>
                </CoachmarkAnchor>
            ) : (
                <Pressable
                    onPress={() => hasMultipleBrands && setBrandListExpanded((v) => !v)}
                    style={styles.headerPressable}
                >
                    <View style={styles.headerRow}>
                        <ImageComponent
                            url={selectedBrand?.image || ""}
                            initials={selectedBrand?.name?.[0] ?? ""}
                            shape="circle"
                            size="small"
                            altText={selectedBrand?.name || "Brand"}
                            style={styles.logoCircle}
                        />
                        <View style={styles.headerBrand}>
                            <Text style={styles.brandName} numberOfLines={1}>
                                {selectedBrand?.name ?? "Brand"}
                            </Text>
                            <Text style={styles.brandSubtitle}>BRAND PORTAL</Text>
                        </View>
                        {hasMultipleBrands ? (
                            <FontAwesomeIcon
                                icon={brandListExpanded ? faChevronUp : faChevronDown}
                                size={14}
                                color={colors.drawerTextMuted}
                            />
                        ) : null}
                    </View>
                </Pressable>
            )}
            {hasMultipleBrands && brandListExpanded && (
                <RNView style={styles.brandListDropdown} pointerEvents="box-none">
                    <ScrollView
                        style={styles.brandListScroll}
                        contentContainerStyle={styles.brandListContent}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        {brands.map((brand) => {
                            const isSelected = brand.id === selectedBrand?.id;
                            return (
                                <Pressable
                                    key={brand.id}
                                    onPress={() => handleBrandSelect(brand)}
                                    style={[
                                        styles.brandListItem,
                                        isSelected && styles.brandListItemSelectedInDropdown,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.brandListItemText,
                                            isSelected && styles.brandListItemTextSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {brand.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </RNView>
            )}
        </LinearGradient>
    );

    return (
        <>
            <DrawerColorsContext.Provider value={drawerColors}>
                <View style={styles.root}>
                    {/* Gradient accent top line */}
                    <LinearGradient
                        colors={["#054463", "#538BA6", "#ff6d2d"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.accentLine}
                        pointerEvents="none"
                    />

                    {/* Brand switcher + collapse button on a single row */}
                    <RNView style={styles.headerWithToggleRow}>
                        <RNView style={styles.headerWrap}>
                            {brandHeaderContent}
                        </RNView>
                        {toggleButtonBare}
                    </RNView>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 1. CONTENT CREATION */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Create</Text>
                            <View style={styles.menuItems}>
                                {contentItems.map((tab, idx) => (
                                    <DrawerMenuItem key={`content-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 2. MANAGE */}
                        <View style={styles.brandDetailsSection}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Manage</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.menuItems}>
                                {MANAGE_MENU_ITEMS(theme).map((tab, idx) => (
                                    <DrawerMenuItem key={`manage-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 3. CREDITS */}
                        {showCreditsSystem && (
                            <>
                                {selectedBrand && !selectedBrand.isBillingDisabled &&
                                    (xl ? (
                                        <CoachmarkAnchor id="guide-tour-credits-web" shape="rect">
                                            <CreditDisplayCard />
                                        </CoachmarkAnchor>
                                    ) : (
                                        <CreditDisplayCard />
                                    ))}
                                {selectedBrand && !selectedBrand.isBillingDisabled && (
                                    <>
                                        {(!selectedBrand.billing ||
                                            selectedBrand?.billing?.planKey === "starter") && (
                                                <RenderBanner
                                                    title="You're on a Free Plan"
                                                    description="Upgrade now to enjoy all the premium features and grow your brand."
                                                    buttonText="Upgrade Now"
                                                />
                                            )}
                                        {selectedBrand.billing?.isOnTrial &&
                                            (selectedBrand.billing?.trialEnds || 0) > Date.now() && (
                                                <RenderBanner
                                                    title={`You're on ${selectedBrand.billing.planKey} plan's Trial`}
                                                    description={`Upgrade now to loose access to this community. Trial ends in ${Math.round(
                                                        ((selectedBrand.billing?.trialEnds || 0) - Date.now()) /
                                                        (1000 * 60 * 60)
                                                    )} hours`}
                                                    buttonText="Pay Now"
                                                    customUrl={selectedBrand.billing.subscriptionUrl}
                                                />
                                            )}
                                        {selectedBrand.billing?.isOnTrial &&
                                            (selectedBrand.billing?.trialEnds || 0) <= Date.now() && (
                                                <RenderBanner
                                                    title="You're Trial has Ended"
                                                    description="To keep using the platform, please pay for the subscription plan"
                                                    buttonText="Pay Now"
                                                    customUrl={selectedBrand.billing.subscriptionUrl}
                                                />
                                            )}
                                    </>
                                )}
                            </>
                        )}

                        {/* 5. INFLUENCER LED GROWTH (independent component) */}
                        {/* <View style={styles.brandDetailsSection}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Influencer Led Growth</Text>
                            </View>
                            <View style={styles.divider} />
                            
                        </View> */}

                        {/* 6. GROWTH */}
                        <View style={styles.brandDetailsSection}>
                            {/* <Pressable
                                onPress={() => { }}
                                onHoverIn={() => setIsGrowthHovered(true)}
                                onHoverOut={() => setIsGrowthHovered(false)}
                            > */}
                            <View
                                style={[
                                    styles.sectionHeaderRow,
                                    isGrowthHovered && styles.sectionHeaderRowHover,
                                ]}
                            >
                                <Text style={styles.sectionTitle}>Growth</Text>
                                {/* <DrawerIcon icon={faChevronRight} size={12} /> */}
                            </View>
                            {/* </Pressable> */}
                            <View style={styles.divider} />
                            <View style={styles.menuItems}>
                                <InfluencerLedGrowth variant="expanded" />
                            </View>
                            <View style={styles.menuItems}>
                                {GROWTH_MENU_ITEMS(theme).map((tab, idx) => (
                                    <DrawerMenuItem key={`growth-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 7. ADMIN PORTAL (sub-drawer trigger) */}
                        {manager?.isAdmin && (
                            <View style={styles.brandDetailsSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>Admin</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.menuItems}>
                                    <AdminPortal variant="expanded" />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <LinearGradient
                        colors={
                            theme.dark
                                ? [
                                    "transparent",
                                    (colors as any).drawerHeaderCardBg ?? colors.card,
                                ]
                                : [
                                    "transparent",
                                    (colors as any).drawerHeaderCardBgLight ?? "#E9F1F7",
                                ]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.bottomActions}
                    >
                        {/* Org dropdown — opens upward */}
                        <RNView style={styles.orgWrap}>
                            {orgDropdownOpen && (
                                <RNView style={styles.orgDropdown}>
                                    {BRAND_DETAILS_MENU_ITEMS(theme).map((tab, idx) => (
                                        <RNView
                                            key={`org-brand-${idx}`}
                                            onTouchEnd={() => setOrgDropdownOpen(false)}
                                        >
                                            <DrawerMenuItem tab={tab} />
                                        </RNView>
                                    ))}
                                    <RNView style={styles.orgDropdownDivider} />
                                    <RNView onTouchEnd={() => setOrgDropdownOpen(false)}>
                                        <DrawerMenuItem
                                            tab={{
                                                href: "/onboarding-your-brand",
                                                icon: ({ focused }) => (
                                                    <DrawerIcon
                                                        href="/onboarding-your-brand"
                                                        icon={faPlus}
                                                        focused={focused}
                                                    />
                                                ),
                                                label: "Create New Brand",
                                            }}
                                        />
                                    </RNView>
                                    <RNView style={styles.orgDropdownDivider} />
                                    {BOTTOM_MENU_ITEMS(
                                        theme,
                                        manager?.name,
                                        manager?.profileImage,
                                        styles
                                    )
                                        .filter(
                                            (tab) => tab.href !== "/onboarding-your-brand"
                                        )
                                        .map((tab, idx) => (
                                            <RNView
                                                key={`org-profile-${idx}`}
                                                onTouchEnd={() => setOrgDropdownOpen(false)}
                                            >
                                                <DrawerMenuItem tab={tab} />
                                            </RNView>
                                        ))}
                                </RNView>
                            )}
                            <Pressable
                                onPress={() => setOrgDropdownOpen((v) => !v)}
                                onHoverIn={() => setIsOrgHovered(true)}
                                onHoverOut={() => setIsOrgHovered(false)}
                                style={[
                                    styles.orgButton,
                                    (isOrgHovered || orgDropdownOpen) && styles.orgButtonHover,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Organization menu"
                            >
                                <RNView style={styles.orgIconCircle}>
                                    <FontAwesomeIcon
                                        icon={faBuilding}
                                        size={14}
                                        color={colors.white}
                                    />
                                </RNView>
                                <View style={styles.orgTextWrap}>
                                    <Text style={styles.orgLabel} numberOfLines={1}>
                                        My Organization
                                    </Text>
                                    <Text style={styles.orgSubtitle} numberOfLines={1}>
                                        {selectedBrand?.name ?? "Brand"}
                                    </Text>
                                </View>
                                <RNView style={styles.orgPresenceDot} />
                                <FontAwesomeIcon
                                    icon={orgDropdownOpen ? faChevronDown : faChevronUp}
                                    size={12}
                                    color={
                                        (colors as any).drawerTextMuted ??
                                        colors.textSecondary
                                    }
                                />
                            </Pressable>
                        </RNView>
                    </LinearGradient>
                </View>
            </DrawerColorsContext.Provider>
        </>
    );
};

// ─── Banner component ────────────────────────────────────────────────────────

const RenderBanner = (props: {
    title: string;
    description: string;
    buttonText: string;
    customUrl?: string;
}) => {
    const theme = useTheme();
    const bannerStyles = useMemo(() => createBannerStyles(theme), [theme]);
    return (
        <LinearGradient
            colors={[Colors(theme).primary, Colors(theme).primaryMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={bannerStyles.gradient}
        >
            <Text style={bannerStyles.bannerTitle}>{props.title}</Text>
            <Text style={bannerStyles.bannerDescription}>{props.description}</Text>
            <Pressable
                onPress={() => {
                    if (props.customUrl) Linking.openURL(props.customUrl);
                    else router.push("/billing");
                }}
                style={({ pressed }) => [
                    bannerStyles.bannerButton,
                    pressed && bannerStyles.bannerButtonPressed,
                ]}
            >
                <Text style={bannerStyles.bannerButtonText}>{props.buttonText}</Text>
            </Pressable>
        </LinearGradient>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: Theme, bottom: number = 0) => {
    const colors = Colors(theme);
    const sidebarSurfaceBg = (colors as any).drawerBackground ?? colors.card;
    const sectionLabelColor =
        (colors as any).drawerSectionLabel ??
        (theme.dark ? colors.textSecondary : colors.drawerTextMuted);
    const sidebarDividerColor = theme.dark
        ? "rgba(83, 139, 166, 0.12)"
        : "rgba(5, 68, 99, 0.08)";

    return StyleSheet.create({
        root: {
            flex: 1,
            overflow: "visible",
            paddingTop: Platform.OS === "web" ? 8 : 64,
            backgroundColor: sidebarSurfaceBg,
            shadowColor: colors.panelShadow,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            elevation: 6,
            borderRightWidth: StyleSheet.hairlineWidth,
            borderRightColor: (colors as any).drawerRightBorder ?? "transparent",
        },
        rootCollapsed: {
            alignItems: "center",
            // Fixed-width rail so the sub-drawer can sit beside it in a row
            width: COLLAPSED_WIDTH,
            flexGrow: 0,
            flexShrink: 0,
            flexBasis: COLLAPSED_WIDTH,
        },
        collapsedWrapper: {
            flex: 1,
            flexDirection: "row",
            backgroundColor: "transparent",
        },
        accentLine: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 10,
        },
        // ── Toggle button ─────────────────────────────────────────────────
        toggleRow: {
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 8,
            paddingTop: 6,
            paddingBottom: 2,
            width: "100%",
        },
        toggleRowCollapsed: {
            justifyContent: "center",
        },
        headerWithToggleRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingRight: 8,
            backgroundColor: "transparent",
            // Lift the whole header row (and its absolutely-positioned brand
            // switcher dropdown) above the menu ScrollView that follows it.
            // Without this, the row sits at z-index auto and the later-painted
            // ScrollView covers the open dropdown — the dropdown's own
            // zIndex:1000 only competes inside this subtree, not against the
            // sibling ScrollView.
            zIndex: 100,
            elevation: 100,
        },
        headerWrap: {
            flex: 1,
            minWidth: 0,
            backgroundColor: "transparent",
            zIndex: 100,
            elevation: 100,
        },
        toggleButton: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor:
                theme.dark ? "rgba(83, 139, 166, 0.10)" : "rgba(5, 68, 99, 0.06)",
            alignItems: "center",
            justifyContent: "center",
        },
        toggleButtonHover: {
            backgroundColor:
                theme.dark ? "rgba(83, 139, 166, 0.22)" : "rgba(5, 68, 99, 0.12)",
        },
        // ── Brand header (expanded) ────────────────────────────────────────
        header: {
            position: "relative",
            overflow: "visible",
            zIndex: 100,
            elevation: 100,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginHorizontal: 8,
            marginBottom: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: (colors as any).drawerHeaderCardBorder ?? "transparent",
        },
        headerPressable: {
            flex: 1,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        logoCircle: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
        },
        logoText: {
            color: colors.white,
            fontSize: 18,
            fontWeight: "700",
        },
        headerBrand: {
            flex: 1,
            minWidth: 0,
            backgroundColor: "transparent",
        },
        brandName: {
            fontSize: 15,
            fontWeight: "700",
            letterSpacing: -0.3,
            color: theme.dark ? colors.drawerText : colors.primary,
        },
        brandSubtitle: {
            fontSize: 9,
            color: (colors as any).drawerTextMuted ?? colors.drawerTextMuted,
            marginTop: 2,
            textTransform: "uppercase" as const,
            letterSpacing: 0.8,
        },
        brandListDropdown: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: (colors as any).drawerHeaderCardBg ?? colors.primary,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            marginTop: 4,
            maxHeight: 220,
            overflow: "hidden",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: (colors as any).drawerHeaderCardBorder ?? colors.drawerBorder,
        },
        brandListScroll: {
            maxHeight: 220,
        },
        brandListContent: {
            paddingTop: 8,
            paddingBottom: 12,
            paddingHorizontal: 4,
            gap: 0,
        },
        brandListItem: {
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginBottom: 2,
        },
        brandListItemSelected: {
            backgroundColor: colors.primary,
        },
        brandListItemSelectedInDropdown: {
            // Saturated primary pill so the white selected-text stays legible on
            // the light dropdown surface (glassSurface is near-white in light
            // theme, which made the white text invisible).
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        brandListItemText: {
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        brandListItemTextSelected: {
            color: colors.white,
            fontWeight: "600",
        },
        // ── Collapsed header ───────────────────────────────────────────────
        collapsedHeader: {
            width: COLLAPSED_WIDTH,
            paddingVertical: 10,
            alignItems: "center",
            justifyContent: "center",
        },
        // ── Scroll areas ───────────────────────────────────────────────────
        scrollContent: {
            paddingVertical: 12,
            paddingHorizontal: 8,
            gap: 8,
            backgroundColor: sidebarSurfaceBg,
        },
        collapsedScrollContent: {
            paddingVertical: 8,
            paddingHorizontal: 0,
            gap: 0,
            // overflow visible so tooltips can extend right
            overflow: "visible",
        },
        collapsedDivider: {
            borderTopWidth: StyleSheet.hairlineWidth,
            marginVertical: 4,
            marginHorizontal: 8,
        },
        // ── Section layouts (expanded) ─────────────────────────────────────
        section: {
            gap: 4,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 10,
            fontWeight: "700",
            paddingHorizontal: 8,
            paddingTop: 6,
            paddingBottom: 2,
            color: sectionLabelColor,
            backgroundColor: "transparent",
            textTransform: "uppercase" as const,
            letterSpacing: 0.9,
        },
        brandDetailsSection: {
            marginTop: 12,
            gap: 4,
            backgroundColor: "transparent",
        },
        sectionHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: -6,
            paddingHorizontal: 8,
            paddingVertical: 10,
            backgroundColor: "transparent",
        },
        sectionHeaderRowHover: {},
        divider: {
            borderTopColor: sidebarDividerColor,
            borderTopWidth: StyleSheet.hairlineWidth,
        },
        menuItems: {
            gap: 0,
            backgroundColor: "transparent",
        },
        // ── Bottom actions ─────────────────────────────────────────────────
        bottomActions: {
            paddingHorizontal: 8,
            paddingTop: 14,
            paddingBottom: Math.max(bottom, 12),
            gap: 6,
            // Lift the bottom panel above the menu ScrollView using shadow
            // (no top border, per design rules)
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 10,
            shadowOpacity: theme.dark ? 0.25 : 0.06,
            elevation: 6,
        },
        orgWrap: {
            position: "relative",
            backgroundColor: "transparent",
        },
        orgDropdown: {
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 6,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor:
                (colors as any).drawerHeaderCardBg ?? colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: theme.dark ? 0.35 : 0.12,
            elevation: 10,
            zIndex: 2000,
        },
        orgButton: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.10)"
                : "rgba(5, 68, 99, 0.06)",
        },
        orgButtonHover: {
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.20)"
                : "rgba(5, 68, 99, 0.12)",
        },
        orgIconCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        orgTextWrap: {
            flex: 1,
            minWidth: 0,
            backgroundColor: "transparent",
        },
        orgLabel: {
            fontSize: 9,
            fontWeight: "700",
            color:
                (colors as any).drawerTextMuted ?? colors.drawerTextMuted,
            textTransform: "uppercase" as const,
            letterSpacing: 0.8,
            marginBottom: 1,
        },
        orgSubtitle: {
            fontSize: 13,
            fontWeight: "600",
            color: theme.dark ? colors.drawerText : colors.primary,
            letterSpacing: -0.2,
        },
        orgDropdownDivider: {
            height: StyleSheet.hairlineWidth,
            backgroundColor: sidebarDividerColor,
            marginVertical: 6,
            marginHorizontal: 12,
        },
        orgPresenceDot: {
            width: 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: "#2ecc71",
            marginRight: 6,
            shadowColor: "#2ecc71",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 4,
        },
        // ── Collapsed mode org button + popover ──────────────────────────
        collapsedOrgWrap: {
            position: "relative",
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
        },
        collapsedOrgButton: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.10)"
                : "rgba(5, 68, 99, 0.06)",
        },
        collapsedOrgButtonHover: {
            backgroundColor: theme.dark
                ? "rgba(83, 139, 166, 0.22)"
                : "rgba(5, 68, 99, 0.12)",
        },
        collapsedPresenceDot: {
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: "#2ecc71",
            shadowColor: "#2ecc71",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 4,
        },
        collapsedOrgPopover: {
            position: "absolute",
            // Sit just to the right of the rail icon, aligned to its bottom
            left: COLLAPSED_WIDTH - 4,
            bottom: 0,
            width: 240,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor:
                (colors as any).drawerHeaderCardBg ?? colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 4, height: 6 },
            shadowRadius: 18,
            shadowOpacity: theme.dark ? 0.4 : 0.16,
            elevation: 12,
            zIndex: 99999,
            ...Platform.select({
                web: {
                    boxShadow: theme.dark
                        ? "0 8px 24px rgba(0,0,0,0.4)"
                        : "0 8px 24px rgba(5, 68, 99, 0.16)",
                } as any,
            }),
        },
        collapsedOrgPopoverHeader: {
            fontSize: 9,
            fontWeight: "700",
            paddingHorizontal: 14,
            paddingTop: 4,
            paddingBottom: 6,
            color: theme.dark ? colors.drawerText : colors.primary,
            textTransform: "uppercase" as const,
            letterSpacing: 0.9,
            backgroundColor: "transparent",
        },
        bottomActionsCollapsed: {
            paddingHorizontal: 0,
            width: COLLAPSED_WIDTH,
            alignItems: "center",
        },
        presenceDot: {
            width: 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: "#2ecc71",
            alignSelf: "flex-end",
            marginRight: 18,
            marginBottom: 4,
            shadowColor: "#2ecc71",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 4,
        },
        profileImageSize: {
            width: 24,
            height: 24,
        },
    });
};

const createBannerStyles = (theme: Theme) => {
    const colors = Colors(theme);
    return StyleSheet.create({
        gradient: {
            borderRadius: 12,
            padding: 16,
            marginHorizontal: 8,
            marginBottom: 12,
            justifyContent: "center",
        },
        bannerTitle: {
            color: colors.white,
            fontWeight: "bold",
            fontSize: 14,
            marginBottom: 4,
        },
        bannerDescription: {
            color: colors.white,
            fontSize: 12,
            marginBottom: 12,
            opacity: 0.85,
        },
        bannerButton: {
            backgroundColor: colors.drawerBannerButtonBg,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            alignSelf: "flex-start",
        },
        bannerButtonPressed: {
            backgroundColor: colors.drawerBannerButtonPressed,
        },
        bannerButtonText: {
            color: colors.white,
            fontWeight: "600",
            fontSize: 13,
        },
    });
};

export default DrawerMenuContentWeb;
