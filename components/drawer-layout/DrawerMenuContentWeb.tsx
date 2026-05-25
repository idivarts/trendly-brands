import { Text, View } from "@/components/theme/Themed";
import { useAuthContext, useLocationContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { useMyNavigation } from "@/shared-libs/utils/router";
import ImageComponent from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import {
    faAddressCard,
    faComment,
    faEye,
    faFileLines,
    faGem,
    faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
    faArrowTrendUp,
    faBullseye,
    faCalendarDays,
    faChartLine,
    faChevronDown,
    faChevronRight,
    faChevronUp,
    faComment as faCommentSolid,
    faCreditCard,
    faDiagramProject,
    faGem as faGemSolid,
    faLayerGroup,
    faPenRuler,
    faPlus,
    faStar as faStarSolid,
    faTriangleExclamation,
    faUsers,
    faUserShield,
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
import DrawerMenuItem, { DrawerIcon, IconPropFn, Tab } from "./DrawerMenuItem";

// Bottom menu items factory
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
                    style={styles?.profileImageSize}
                />
            ),
            label: name || "Profile",
        },
    ];

// Content Creation section
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

// Campaign section (India only)
const CAMPAIGN_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/discover",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/discover" icon={faGemSolid} focused={focused} />
            ) : (
                <DrawerIcon href="/discover" icon={faGem} focused={focused} />
            ),
        label: "Discover Influencers",
        pro: true,
    },
    {
        href: "/collaborations",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/collaborations" icon={faStarSolid} focused={focused} />
            ) : (
                <DrawerIcon href="/collaborations" icon={faStar} focused={focused} />
            ),
        label: "Collaboration Requests",
    },
];

// Execution section
const EXECUTION_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/messages",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/messages" icon={faCommentSolid} focused={focused} />
            ) : (
                <DrawerIcon href="/messages" icon={faComment} focused={focused} />
            ),
        label: "Messages",
        showUnreadCount: true,
    },
    {
        href: "/contracts",
        icon: ({ focused }) => <DrawerIcon href="/contracts" icon={faFileLines} focused={focused} />,
        label: "Influencer Contracts",
    },
    {
        href: "/analytics",
        icon: ({ focused }) => <DrawerIcon href="/analytics" icon={faChartLine} focused={focused} />,
        label: "Reporting & Analytics",
    },
];

// Brand Management section
const BRAND_DETAILS_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/brand-profile",
        icon: ({ focused }) => <DrawerIcon href="" icon={faFileLines} focused={focused} />,
        label: "Brand Profile",
    },
    {
        href: "/members",
        icon: ({ focused }) => <DrawerIcon href="" icon={faUsers} focused={focused} />,
        label: "Members",
    },
    {
        href: "/billing",
        icon: ({ focused }) => <DrawerIcon href="" icon={faCreditCard} focused={focused} />,
        label: "Billing",
    },
];

// Growth section
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
    {
        href: "/performance-marketing",
        icon: ({ focused }) => <DrawerIcon href="/performance-marketing" icon={faChartLine} focused={focused} />,
        label: "Performance Marketing",
    },
];

// Admin Portal section
const ADMIN_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/admin-invites",
        icon: ({ focused }) => <DrawerIcon href="/kanban-board" icon={faUserShield} focused={focused} />,
        label: "Invites Management",
    },
    {
        href: "/brand-crm",
        icon: ({ focused }) => <DrawerIcon href="/brand-crm" icon={faAddressCard} focused={focused} />,
        label: "Brands CRM",
    },
    {
        href: "/collaboration-cms",
        icon: ({ focused }) => <DrawerIcon href="/collaboration-cms" icon={faDiagramProject} focused={focused} />,
        label: "Collaboration CMS",
    },
    {
        href: "/applications",
        icon: ({ focused }) => <DrawerIcon href="/applications" icon={faEye} focused={focused} />,
        label: "All Applications",
    },
    {
        href: "/admin-escalations",
        icon: ({ focused }) => <DrawerIcon href="/admin-escalations" icon={faTriangleExclamation} focused={focused} />,
        label: "Escalations",
    },
];

interface DrawerMenuContentWebProps { }

const DrawerMenuContentWeb: React.FC<DrawerMenuContentWebProps> = () => {
    const nav = useMyNavigation();
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme, bottom), [theme, bottom]);
    const { selectedBrand, brands, setSelectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const { isIndiaBased } = useLocationContext();
    const { xl } = useBreakpoints();

    const planKey = selectedBrand?.billing?.planKey || "";
    const hasMultipleBrands = brands.length > 1;

    const drawerColors = useMemo(
        () =>
            theme.dark
                ? {
                    inactiveColor: colors.text,
                    activeColor: colors.onPrimary,
                    inactiveBg: "transparent",
                }
                : {
                    inactiveColor: colors.primary,
                    activeColor: colors.white,
                    inactiveBg: "transparent",
                },
        [theme.dark, colors.primary, colors.white, colors.text, colors.onPrimary]
    );

    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isAdminHovered, setIsAdminHovered] = useState(false);
    const [isBrandMgmtHovered, setIsBrandMgmtHovered] = useState(false);
    const [isGrowthHovered, setIsGrowthHovered] = useState(false);
    const [brandListExpanded, setBrandListExpanded] = useState(false);

    const showCreditsSystem = false

    const handleBrandSelect = (brand: Brand) => {
        setSelectedBrand(brand);
        setBrandListExpanded(false);
    };

    // Content Creation items — add Collaboration Requests if outside India
    const contentItems = useMemo(() => {
        const base = CONTENT_MENU_ITEMS(theme);
        if (!isIndiaBased) {
            base.push({
                href: "/collaborations",
                icon: ({ focused }: IconPropFn) =>
                    focused ? (
                        <DrawerIcon href="/collaborations" icon={faStarSolid} focused={focused} />
                    ) : (
                        <DrawerIcon href="/collaborations" icon={faStar} focused={focused} />
                    ),
                label: "Collaboration Requests",
            });
        }
        return base;
    }, [isIndiaBased, theme]);

    const brandHeaderContent = (
        <View style={styles.header}>
            {xl ? (
                <CoachmarkAnchor
                    id="guide-tour-brand-switcher-web"
                    shape="rect"
                >
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
        </View>
    );

    return (
        <>
            <DrawerColorsContext.Provider value={drawerColors}>
                <View style={styles.root}>
                    {brandHeaderContent}

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 1. CONTENT CREATION */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>CONTENT CREATION</Text>
                            <View style={styles.menuItems}>
                                {contentItems.map((tab, idx) => (
                                    <DrawerMenuItem key={`content-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 2. CAMPAIGN (India only) */}
                        {isIndiaBased && (
                            <View style={styles.brandDetailsSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>CAMPAIGN</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.menuItems}>
                                    {CAMPAIGN_MENU_ITEMS(theme).map((tab, idx) => (
                                        <DrawerMenuItem
                                            key={`campaign-${idx}`}
                                            tab={tab}
                                            proLock={tab.pro && planKey !== "pro" && planKey !== "enterprise"}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* 3. CREDITS */}
                        {showCreditsSystem && <>
                            {selectedBrand && !selectedBrand.isBillingDisabled &&
                                (xl ? (
                                    <CoachmarkAnchor
                                        id="guide-tour-credits-web"
                                        shape="rect"
                                    >
                                        <CreditDisplayCard />
                                    </CoachmarkAnchor>
                                ) : (
                                    <CreditDisplayCard />
                                )
                                )}
                            {selectedBrand && !selectedBrand.isBillingDisabled && (
                                <>
                                    {(!selectedBrand.billing || selectedBrand?.billing?.planKey === "starter") && (
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
                                                title={`You're Trial has Ended`}
                                                description={`To keep using the platform, please pay for the subscription plan`}
                                                buttonText="Pay Now"
                                                customUrl={selectedBrand.billing.subscriptionUrl}
                                            />
                                        )}
                                </>
                            )}
                        </>}

                        {/* 4. EXECUTION */}
                        {manager?.isChatConnected &&
                            <View style={styles.brandDetailsSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>EXECUTION</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.menuItems}>
                                    {EXECUTION_MENU_ITEMS(theme).map((tab, idx) => (
                                        <DrawerMenuItem key={`execution-${idx}`} tab={tab} />
                                    ))}
                                </View>
                            </View>}



                        {/* 5. BRAND MANAGEMENT */}
                        <View style={styles.brandDetailsSection}>
                            <Pressable
                                onPress={() => nav.push("/menu")}
                                onHoverIn={() => setIsBrandMgmtHovered(true)}
                                onHoverOut={() => setIsBrandMgmtHovered(false)}
                            >
                                <View
                                    style={[
                                        styles.sectionHeaderRow,
                                        isBrandMgmtHovered && styles.sectionHeaderRowHover,
                                    ]}
                                >
                                    <Text style={styles.sectionTitle}>BRAND MANAGEMENT</Text>
                                    <DrawerIcon icon={faChevronRight} size={12} />
                                </View>
                            </Pressable>
                            <View style={styles.divider} />
                            <View style={styles.menuItems}>
                                {BRAND_DETAILS_MENU_ITEMS(theme).map((tab, idx) => (
                                    <DrawerMenuItem key={`brand-details-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 6. GROWTH */}
                        <View style={styles.brandDetailsSection}>
                            <Pressable
                                onPress={() => { }}
                                onHoverIn={() => setIsGrowthHovered(true)}
                                onHoverOut={() => setIsGrowthHovered(false)}
                            >
                                <View
                                    style={[
                                        styles.sectionHeaderRow,
                                        isGrowthHovered && styles.sectionHeaderRowHover,
                                    ]}
                                >
                                    <Text style={styles.sectionTitle}>GROWTH</Text>
                                    <DrawerIcon icon={faChevronRight} size={12} />
                                </View>
                            </Pressable>
                            <View style={styles.divider} />
                            <View style={styles.menuItems}>
                                {GROWTH_MENU_ITEMS(theme).map((tab, idx) => (
                                    <DrawerMenuItem key={`growth-${idx}`} tab={tab} />
                                ))}
                            </View>
                        </View>

                        {/* 7. ADMIN PORTAL */}
                        {manager?.isAdmin && (
                            <View style={styles.brandDetailsSection}>
                                <Pressable
                                    onPress={() => { }}
                                    onHoverIn={() => setIsAdminHovered(true)}
                                    onHoverOut={() => setIsAdminHovered(false)}
                                >
                                    <View
                                        style={[
                                            styles.sectionHeaderRow,
                                            isAdminHovered && styles.sectionHeaderRowHover,
                                        ]}
                                    >
                                        <Text style={styles.sectionTitle}>Admin Portal</Text>
                                        <DrawerIcon icon={faChevronRight} size={12} />
                                    </View>
                                </Pressable>

                                <View style={styles.divider} />
                                <View style={styles.menuItems}>
                                    {ADMIN_MENU_ITEMS(theme).map((tab, idx) => (
                                        <DrawerMenuItem key={`admin-${idx}`} tab={tab} />
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.bottomActions}>
                        {BOTTOM_MENU_ITEMS(theme, manager?.name, manager?.profileImage, styles).map(
                            (tab, idx) => (
                                <DrawerMenuItem key={`bottom-${idx}`} tab={tab} />
                            )
                        )}
                    </View>
                </View>
            </DrawerColorsContext.Provider>
        </>
    );
};

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
            <Text style={bannerStyles.bannerTitle}>
                {props.title}
            </Text>
            <Text style={bannerStyles.bannerDescription}>
                {props.description}
            </Text>
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
                <Text style={bannerStyles.bannerButtonText}>
                    {props.buttonText}
                </Text>
            </Pressable>
        </LinearGradient>
    );
};

const createStyles = (theme: Theme, bottom: number = 0) => {
    const colors = Colors(theme);
    const sidebarSurfaceBg = colors.card;
    const sectionLabelColor = theme.dark ? colors.textSecondary : colors.drawerTextMuted;
    const sidebarDividerColor = theme.dark ? colors.border : colors.drawerBorder;
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
        },
        header: {
            position: "relative",
            overflow: "visible",
            zIndex: 100,
            elevation: 100,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            marginHorizontal: 8,
            marginBottom: 4,
            borderRadius: 12,
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
            fontSize: 16,
            fontWeight: "700",
            color: colors.drawerText,
        },
        brandSubtitle: {
            fontSize: 11,
            color: colors.drawerTextMuted,
            marginTop: 2,
        },
        brandListDropdown: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: colors.primary,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            marginTop: 4,
            maxHeight: 220,
            overflow: "hidden",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.drawerBorder,
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
            backgroundColor: colors.glassSurface,
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
        scrollContent: {
            paddingVertical: 12,
            paddingHorizontal: 8,
            gap: 8,
            backgroundColor: sidebarSurfaceBg,
        },
        section: {
            gap: 8,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: "600",
            paddingHorizontal: 8,
            color: sectionLabelColor,
            backgroundColor: "transparent",
        },
        brandDetailsSection: {
            marginTop: 16,
            gap: 8,
            backgroundColor: "transparent",
        },
        sectionHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: -10,
            paddingHorizontal: 8,
            paddingVertical: 12,
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
        bottomActions: {
            paddingHorizontal: 8,
            paddingTop: 12,
            paddingBottom: bottom,
            backgroundColor: sidebarSurfaceBg,
            borderTopColor: sidebarDividerColor,
            borderTopWidth: StyleSheet.hairlineWidth,
            gap: 4,
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
