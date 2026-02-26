import { Text, View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import ImageComponent from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import {
    faAddressCard,
    faComment,
    faEye,
    faFileLines,
    faGem,
    faStar
} from "@fortawesome/free-regular-svg-icons";
import {
    faChevronRight,
    faChevronDown,
    faChevronUp,
    faComment as faCommentSolid,
    faCreditCard,
    faDiagramProject,
    faGem as faGemSolid,
    faBolt,
    faPlus,
    faSliders,
    faStar as faStarSolid,
    faUsers,
    faUserShield
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
    ScrollView,
    StyleSheet,
    View as RNView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brand } from "@/types/Brand";
import { DrawerColorsContext } from "./drawer-colors-context";
import DrawerMenuItem, { DrawerIcon, IconPropFn, Tab } from "./DrawerMenuItem";
//  import BrandActionItem from "./BrandActionItem";
// Bottom menu items factory
const BOTTOM_MENU_ITEMS = (
    theme: Theme,
    name?: string,
    profileImage?: string,
    styles?: { profileImageSize: { width: number; height: number } }
): Tab[] => [
        {
            href: "/onboarding-your-brand",
            icon: () => <DrawerIcon href="/onboarding-your-brand" icon={faPlus} />,
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
// Brand Details menu items
const BRAND_DETAILS_MENU_ITEMS = (theme: Theme): Tab[] => [
    // {
    //   href: "/preferences",
    //   icon: () => <DrawerIcon href="" icon={faSliders} />,
    //   label: "Influencer Preferences",
    // },
    {
        href: "/brand-profile",
        icon: () => <DrawerIcon href="" icon={faFileLines} />,
        label: "Brand Profile",
    },
    {
        href: "/members",
        icon: () => <DrawerIcon href="" icon={faUsers} />,
        label: "Members",
    },
    {
        href: "/contracts",
        icon: () => <DrawerIcon href="/contracts" icon={faFileLines} />,
        label: "Contracts",
    },
    {
        href: "/billing",
        icon: () => <DrawerIcon href="" icon={faCreditCard} />,
        label: "Billing",
    },
];

// Showcase menu items
const SHOWCASE_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/explore-influencers",
        icon: () => <DrawerIcon href="/explore-influencers" icon={faStar} />,
        label: "Influencer Spotlights",
    },
    {
        href: "/preferences",
        icon: () => <DrawerIcon href="" icon={faSliders} />,
        label: "Preferences",
    },
];

interface DrawerMenuContentProps { }

const CAMPAIGN_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/discover",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/discover" icon={faGemSolid} />
            ) : (
                <DrawerIcon href="/discover" icon={faGem} />
            ),
        label: "Discovery",
        pro: true,
    },
    {
        href: "/collaborations",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/collaborations" icon={faStarSolid} />
            ) : (
                <DrawerIcon href="/collaborations" icon={faStar} />
            ),
        label: "Campaigns",
    },
    // {
    //   href: "/explore-influencers",
    //   icon: ({ focused }: IconPropFn) =>
    //     focused ? (
    //       <DrawerIcon href="/explore-influencers" icon={faHeartSolid} />
    //     ) : (
    //       <DrawerIcon href="/explore-influencers" icon={faHeart} />
    //     ),
    //   label: "Spotlights",
    // },
    {
        href: "/messages",
        icon: ({ focused }: IconPropFn) =>
            focused ? (
                <DrawerIcon href="/messages" icon={faCommentSolid} />
            ) : (
                <DrawerIcon href="/messages" icon={faComment} />
            ),
        label: "Messages",
        showUnreadCount: true,
    },
];

const ADMIN_MENU_ITEMS = (theme: Theme): Tab[] => [
    {
        href: "/admin-invites",
        icon: () => <DrawerIcon href="/kanban-board" icon={faUserShield} />,
        label: "Invites Management",
    },
    {
        href: "/brand-crm",
        icon: () => <DrawerIcon href="/brand-crm" icon={faAddressCard} />,
        label: "Brands CRM",
    },
    {
        href: "/collaboration-cms",
        icon: () => <DrawerIcon href="/collaboration-cms" icon={faDiagramProject} />,
        label: "Collaboration CMS",
    },
    {
        href: "/applications",
        icon: () => <DrawerIcon href="/applications" icon={faEye} />,
        label: "All Applications",
    },
];

const DrawerMenuContentWeb: React.FC<DrawerMenuContentProps> = () => {
    const nav = useMyNavigation();
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(theme, bottom), [theme, bottom]);
    const { selectedBrand, brands, setSelectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    const planKey = selectedBrand?.billing?.planKey || "";
    const discoverCoinsLeft = Number(selectedBrand?.credits?.discovery ?? 0);
    const connectionCreditsLeft = Number(selectedBrand?.credits?.connection ?? 0);
    const discoveryLimit = 1000;
    const discoveryProgress = Math.min(1, discoverCoinsLeft / discoveryLimit);
    const hasMultipleBrands = brands.length > 1;

    const drawerColors = useMemo(
        () => ({ inactiveColor: colors.drawerText, activeColor: colors.white }),
        [colors.drawerText, colors.white]
    );

    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isAdminHovered, setIsAdminHovered] = useState(false);
    const [brandListExpanded, setBrandListExpanded] = useState(false);

    const handleBrandSelect = (brand: Brand) => {
        setSelectedBrand(brand);
        setBrandListExpanded(false);
    };

    return (
        <DrawerColorsContext.Provider value={drawerColors}>
            <View style={styles.root}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => hasMultipleBrands && setBrandListExpanded((v) => !v)}
                        style={styles.headerPressable}
                    >
                        <View style={styles.headerRow}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoText}>T</Text>
                            </View>
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
                    {hasMultipleBrands && brandListExpanded && (
                        <View style={styles.brandListContainer}>
                            {brands.map((brand) => {
                                const isSelected = brand.id === selectedBrand?.id;
                                return (
                                    <Pressable
                                        key={brand.id}
                                        onPress={() => handleBrandSelect(brand)}
                                        style={[
                                            styles.brandListItem,
                                            isSelected && styles.brandListItemSelected,
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
                        </View>
                    )}
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>CONNECT</Text>
                        <View style={styles.campaignItems}>
                            {CAMPAIGN_MENU_ITEMS(theme).map((tab, idx) => (
                                <DrawerMenuItem
                                    key={`campaign-${idx}`}
                                    tab={tab}
                                    proLock={tab.pro && planKey !== "pro" && planKey !== "enterprise"}
                                />
                            ))}
                        </View>
                    </View>

                    {selectedBrand && !selectedBrand.isBillingDisabled && (
                        <View style={styles.creditsCard}>
                            <Pressable
                                onPress={() => nav.push("/billing")}
                                style={styles.creditsRow}
                            >
                                <FontAwesomeIcon
                                    icon={faGemSolid}
                                    size={18}
                                    color={colors.gold}
                                    style={styles.creditsIcon}
                                />
                                <Text style={styles.creditsDiscoveryText}>
                                    {discoverCoinsLeft} Discovery
                                </Text>
                                <Text style={styles.refillLink}>REFILL</Text>
                            </Pressable>
                            <RNView style={styles.progressTrack}>
                                <RNView
                                    style={[
                                        styles.progressFill,
                                        { width: `${discoveryProgress * 100}%` },
                                    ]}
                                />
                            </RNView>
                            <View style={styles.creditsRow}>
                                <FontAwesomeIcon
                                    icon={faBolt}
                                    size={18}
                                    color={colors.drawerInvitesIcon}
                                    style={styles.creditsIcon}
                                />
                                <Text style={styles.creditsInvitesText}>
                                    {connectionCreditsLeft} Invites
                                </Text>
                                <Text style={styles.creditsMonthly}>Monthly</Text>
                            </View>
                        </View>
                    )}
                {selectedBrand && !selectedBrand.isBillingDisabled && (
                    <>
                        {(!selectedBrand.billing || selectedBrand?.billing?.planKey === "starter") && (
                            <RenderBanner
                                title="You’re on a Free Plan"
                                description="Upgrade now to enjoy all the premium features and grow your brand."
                                buttonText="Upgrade Now"
                            />
                        )}
                        {selectedBrand.billing?.isOnTrial &&
                            (selectedBrand.billing?.trialEnds || 0) > Date.now() && (
                                <RenderBanner
                                    title={`You’re on ${selectedBrand.billing.planKey} plan's Trial`}
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
                                    title={`You’re Trial has Ended`}
                                    description={`To keep using the platform, please pay for the subscription plan`}
                                    buttonText="Pay Now"
                                    customUrl={selectedBrand.billing.subscriptionUrl}
                                />
                            )}
                    </>
                )}

                {/* BRAND MANAGEMENT */}
                <View style={styles.brandDetailsSection}>
                    <Pressable
                        onPress={() => nav.push("/menu")}
                        onHoverIn={() => setIsBrandHovered(true)}
                        onHoverOut={() => setIsBrandHovered(false)}
                    >
                        <View
                            style={[
                                styles.sectionHeaderRow,
                                isBrandHovered && styles.sectionHeaderRowHover,
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
                {/* INSIGHTS */}
                <View style={styles.brandDetailsSection}>
                    <Pressable onPress={() => nav.push("/menu")}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>INSIGHTS</Text>
                            <DrawerIcon icon={faChevronRight} size={12} />
                        </View>
                    </Pressable>

                    <View style={styles.divider} />
                    <View style={styles.menuItems}>
                        {SHOWCASE_MENU_ITEMS(theme).map((tab, idx) => (
                            <DrawerMenuItem key={`showcase-${idx}`} tab={tab} />
                        ))}
                    </View>
                </View>

                {/* Admin Section */}
                {manager?.isAdmin && (
                    <View style={styles.brandDetailsSection}>
                        <Pressable
                            onPress={() => {}}
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
    return StyleSheet.create({
        root: {
            flex: 1,
            paddingTop: Platform.OS === "web" ? 8 : 64,
            backgroundColor: colors.drawerBackground,
        },
        header: {
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: colors.drawerHeaderBg,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            marginHorizontal: 8,
            marginBottom: 4,
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
        brandListContainer: {
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.drawerBorder,
            gap: 0,
            backgroundColor: "transparent",
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
            backgroundColor: colors.drawerBackground,
        },
        section: {
            gap: 8,
            backgroundColor: "transparent",
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: "600",
            paddingHorizontal: 8,
            color: colors.drawerTextMuted,
            backgroundColor: "transparent",
        },
        campaignItems: {
            rowGap: 2,
            backgroundColor: "transparent",
        },
        creditsCard: {
            backgroundColor: colors.drawerCardBg,
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 8,
            gap: 8,
        },
        creditsRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
        },
        creditsIcon: {
            marginRight: 8,
        },
        creditsDiscoveryText: {
            flex: 1,
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        refillLink: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.aliceBlue,
        },
        progressTrack: {
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.drawerProgressTrack,
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            backgroundColor: colors.drawerProgressFill,
            borderRadius: 3,
        },
        creditsInvitesText: {
            flex: 1,
            fontSize: 14,
            color: colors.drawerText,
            fontWeight: "500",
        },
        creditsMonthly: {
            fontSize: 11,
            color: colors.drawerTextMuted,
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
        sectionHeaderRowHover: {
            // borderWidth: StyleSheet.hairlineWidth,z
            // borderColor: colors.drawerBorder,
            
        },
        divider: {
            borderTopColor: colors.drawerBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
        },
        menuItems: {
            gap: 0,
            backgroundColor: "transparent"
        },
        bottomActions: {
            paddingHorizontal: 8,
            paddingTop: 12,
            paddingBottom: bottom,
            backgroundColor: colors.drawerHeaderBg,
            borderTopColor: colors.drawerBorder,
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