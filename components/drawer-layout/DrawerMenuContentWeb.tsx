import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useMyNavigation } from "@/shared-libs/utils/router";
import ImageComponent from "@/shared-uis/components/image-component";
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
    faComment as faCommentSolid,
    faCreditCard,
    faDiagramProject,
    faGem as faGemSolid,
    faPlus,
    faSliders,
    faStar as faStarSolid,
    faUsers,
    faUserShield
} from "@fortawesome/free-solid-svg-icons";
import { Theme, useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandSwitcher, { OpenBrandSwitcher } from "../ui/brand-switcher";
import DrawerMenuItem, { DrawerIcon, IconPropFn, Tab } from "./DrawerMenuItem";
//  import BrandActionItem from "./BrandActionItem";
// Bottom menu items factory
const BOTTOM_MENU_ITEMS = (
    theme: Theme,
    name?: string,
    profileImage?: string
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
                    style={{ width: 24, height: 24 }}
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
    const router = useMyNavigation();
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const { selectedBrand } = useBrandContext();
    const { manager } = useAuthContext();

    // const [isAdmin, setIsAdmin] = useState<boolean>(false);
    // React.useEffect(() => {
    //   if (manager) {
    //     setIsAdmin(!!manager.isAdmin);
    //     console.log("🛡️ isAdmin flag:", manager.isAdmin);
    //     console.log("👤 Manager object:", manager);
    //   }
    // }, [manager]);

    const planKey = selectedBrand?.billing?.planKey || "";

    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isAdminHovered, setIsAdminHovered] = useState(false);

    return (
        <View
            style={{
                flex: 1,
                paddingTop: Platform.OS === "web" ? 8 : 64,
                backgroundColor: Colors(theme).background,
            }}
        >
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 12,
                    paddingBottom: 12,
                    borderBottomColor: Colors(theme).border,
                    borderBottomWidth: StyleSheet.hairlineWidth,

                }}
            >
                <Pressable
                    onPress={() => {
                        OpenBrandSwitcher.next(undefined);
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "700",
                                paddingVertical: 10,
                                flex: 1,
                                color: Colors(theme).text,
                            }}
                        >
                            {selectedBrand?.name ?? "Brand"}
                        </Text>
                        {/* Quick switcher (if available on layout) */}
                        <BrandSwitcher />
                    </View>
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{
                    paddingVertical: 12,
                    paddingHorizontal: 8, //MarkerBYJ
                    gap: 8,

                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Campaigns Section */}
                <View style={{ gap: 8, }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "600",
                            opacity: 0.7,
                            paddingHorizontal: 8,
                            color: Colors(theme).text,

                        }}
                    >
                        Connect
                    </Text>
                    <View style={{ rowGap: 2 }}>
                        {CAMPAIGN_MENU_ITEMS(theme).map((tab, idx) => (
                            <DrawerMenuItem
                                key={`campaign-${idx}`}
                                tab={tab}
                                proLock={tab.pro && planKey != "pro" && planKey != "enterprise"}
                            />
                        ))}
                    </View>
                </View>

                {/* Promotional Banner */}
                {selectedBrand && !selectedBrand.isBillingDisabled && (
                    <>
                        {!selectedBrand.billing || selectedBrand?.billing?.planKey == "starter" && (
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

                {/* Brand Details Section */}
                <View style={{ marginTop: 16, gap: 8 }}>
                    <Pressable
                        onPress={() => {
                            router.push("/menu");
                        }}
                        onHoverIn={() => setIsBrandHovered(true)}
                        onHoverOut={() => setIsBrandHovered(false)}
                    >
                        <View
                            style={[
                                {
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: -10,
                                    paddingHorizontal: 8,
                                    paddingVertical: 12,
                                },
                                isBrandHovered && {
                                    borderWidth: StyleSheet.hairlineWidth,
                                    borderColor: Colors(theme).border,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    opacity: 0.7,
                                    color: Colors(theme).text,
                                }}
                            >
                                Brand Details
                            </Text>
                            <DrawerIcon icon={faChevronRight} size={12} />
                        </View>
                    </Pressable>

                    <View
                        style={{
                            borderTopColor: Colors(theme).border,
                            borderTopWidth: StyleSheet.hairlineWidth,
                        }}
                    />
                    <View style={{ gap: 0 }}>
                        {BRAND_DETAILS_MENU_ITEMS(theme).map((tab, idx) => (
                            <DrawerMenuItem key={`brand-details-${idx}`} tab={tab} />
                        ))}
                    </View>
                </View>
                {/* Showcase Section */}
                <View style={{ marginTop: 16, gap: 8 }}>
                    <Pressable
                        onPress={() => {
                            router.push("/menu");
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: -10,
                                paddingHorizontal: 8,
                                paddingVertical: 12,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    opacity: 0.7,
                                    color: Colors(theme).text,
                                }}
                            >
                                Showcase (Already Joined)
                            </Text>
                            <DrawerIcon icon={faChevronRight} size={12} />
                        </View>
                    </Pressable>

                    <View
                        style={{
                            borderTopColor: Colors(theme).border,
                            borderTopWidth: StyleSheet.hairlineWidth,
                        }}
                    />
                    <View style={{ gap: 0 }}>
                        {SHOWCASE_MENU_ITEMS(theme).map((tab, idx) => (
                            <DrawerMenuItem key={`showcase-${idx}`} tab={tab} />
                        ))}
                    </View>
                </View>

                {/* Admin Section */}
                {manager?.isAdmin && (
                    <View style={{ marginTop: 16, gap: 8 }}>
                        <Pressable
                            onPress={() => {
                                console.log("🛡️ Admin Portal clicked");
                            }}
                            onHoverIn={() => setIsAdminHovered(true)}
                            onHoverOut={() => setIsAdminHovered(false)}
                        >
                            <View
                                style={[
                                    {
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: -10,
                                        paddingHorizontal: 8,
                                        paddingVertical: 12,
                                    },
                                    isAdminHovered && {
                                        borderWidth: StyleSheet.hairlineWidth,
                                        borderColor: Colors(theme).border,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: "600",
                                        opacity: 0.7,
                                        color: Colors(theme).text,
                                    }}
                                >
                                    Admin Portal
                                </Text>
                                <DrawerIcon icon={faChevronRight} size={12} />
                            </View>
                        </Pressable>

                        <View
                            style={{
                                borderTopColor: Colors(theme).border,
                                borderTopWidth: StyleSheet.hairlineWidth,
                            }}
                        />
                        <View style={{ gap: 0 }}>
                            {ADMIN_MENU_ITEMS(theme).map((tab, idx) => (
                                <DrawerMenuItem key={`admin-${idx}`} tab={tab} />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <View
                style={{
                    paddingHorizontal: 8,
                    paddingTop: 4,
                    paddingBottom: bottom,
                    borderTopColor: Colors(theme).border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    gap: 4,
                }}
            >
                {BOTTOM_MENU_ITEMS(theme, manager?.name, manager?.profileImage).map(
                    (tab, idx) => (
                        <DrawerMenuItem key={`bottom-${idx}`} tab={tab} />
                    )
                )}
            </View>
        </View>
    );
};

const RenderBanner = (props: {
    title: string;
    description: string;
    buttonText: string;
    customUrl?: string;
}) => {
    return (
        <LinearGradient
            colors={["#3b82f6", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 8,
                marginBottom: 12,
                justifyContent: "center",
            }}
        >
            <Text
                style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 14,
                    marginBottom: 4,
                }}
            >
                {props.title}
            </Text>
            <Text
                style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 12,
                    marginBottom: 12,
                }}
            >
                {props.description}
            </Text>
            <Pressable
                onPress={() => {
                    if (props.customUrl) Linking.openURL(props.customUrl);
                    else router.push("/billing");
                }}
                style={({ pressed }) => ({
                    backgroundColor: pressed
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.4)",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    alignSelf: "flex-start",
                })}
            >
                <Text
                    style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: 13,
                    }}
                >
                    {props.buttonText}
                </Text>
            </Pressable>
        </LinearGradient>
    );
};

export default DrawerMenuContentWeb;