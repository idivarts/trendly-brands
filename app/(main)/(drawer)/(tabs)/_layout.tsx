import { router, Tabs } from "expo-router";
import React from "react";

import { PremiumActionTag } from "@/components/discover/components/PremiumActionTag";
import { OpenFilterRightPanel } from "@/components/discover/discovery-context";
import Header from "@/components/explore-influencers/header";
import InfluencerConnects from "@/components/explore-influencers/InfluencerConnects";
import ProfileIcon from "@/components/explore-influencers/profile-icon";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import Colors from "@/constants/Colors";
import { useAuthContext, useChatContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { IS_MONETIZATION_DONE } from "@/shared-constants/app";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
    faComment,
    faGem,
    faHeart,
    faStar
} from "@fortawesome/free-regular-svg-icons";
import {
    faComment as faCommentSolid,
    faCopy,
    faFilter,
    faGem as faGemSolid,
    faHeart as faHeartSolid,
    faStar as faStarSolid
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Pressable } from "react-native";
import { Badge } from "react-native-paper";

const TabLayout = () => {
    const { xl } = useBreakpoints();
    const theme = useTheme();
    const { unreadCount } = useChatContext()
    const { manager } = useAuthContext();
    const { selectedBrand } = useBrandContext()
    const discoverCoinsLeft = Number((selectedBrand)?.credits?.discovery ?? 0)
    const connectionCreditsLeft = Number((selectedBrand)?.credits?.connection ?? 0)
    const influencerCredits = selectedBrand?.credits?.influencer || (IS_MONETIZATION_DONE ? 0 : 1000)

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors(theme).primary,
                tabBarInactiveTintColor: Colors(theme).text,
                headerShown: useClientOnlyValue(false, true),
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    display: xl ? "none" : "flex",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    height: 70,
                    borderTopWidth: 1,
                    borderTopColor: Colors(theme).border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    backgroundColor: Colors(theme).background,
                },
                headerTitleAlign: "left",
                headerTitleStyle: {
                    fontSize: 22,
                    fontWeight: "600",
                },
                headerStyle: {
                    backgroundColor: Colors(theme).background,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors(theme).border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                },
            }}
        >
            <Tabs.Screen
                name="explore-influencers"
                options={{
                    title: xl ? "Influencer Spotlights" : "Spotlights",
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faHeartSolid : faHeart}
                            size={22}
                        />
                    ),
                    headerTitle() {
                        return <Header />;
                    },
                    headerRight: () => (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                justifyContent: "space-between",
                            }}
                        >
                            <PremiumActionTag
                                label="Influencers remaining"
                                tooltip={"This means how many influencers you can unlock from the explore influencers page. Please upgrade if you have exhausted the limit here.\n\nLimit recharges every month depending on what plan you are on"}
                                icon="star-four-points"
                                variant="gold"
                                count={influencerCredits}
                            />
                            <NotificationIcon />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <>
                            <FontAwesomeIcon
                                color={color}
                                icon={focused ? faCommentSolid : faComment}
                                size={22}
                            />
                            {(unreadCount > 0) && (
                                <Badge
                                    visible={true}
                                    size={16}
                                    selectionColor={Colors(theme).red}
                                    style={{
                                        backgroundColor: Colors(theme).red,
                                        zIndex: 1,
                                        position: "absolute",
                                        top: 0,
                                        right: 20,
                                    }}
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                        </>
                    ),
                    title: "Messages",
                    headerTitleAlign: "left",
                    headerRight: () => <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <NotificationIcon />
                    </View>,
                }}
            />

            <Tabs.Screen
                name="discover"
                options={{
                    title: xl ? "Discover Influencers" : "Discover",
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faGemSolid : faGem}
                            size={22}
                        />
                    ),
                    headerRight: () => <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8, }}>
                            <PremiumActionTag
                                label="Discovery remaining"
                                tooltip={"Open deep statistics for any influencer on the discover page. Uses 1 coin each time you open a unique profile on the discover page.\n\nLimit recharges every month depending on what plan you are on"}
                                icon="diamond-stone"
                                variant="gold"
                                count={discoverCoinsLeft}
                            />
                            <PremiumActionTag
                                label="Invites remaining"
                                tooltip={"We reach out to the influencer on your behalf and connect you directly. Uses 1 coin whenever you invite any influencer.\n\nLimit recharges every month depending on what plan you are on"}
                                icon="lightning-bolt"
                                variant="purple"
                                count={connectionCreditsLeft}
                            />
                            {!xl &&
                                <Pressable onPress={() => {
                                    OpenFilterRightPanel.next();
                                }} style={{ marginLeft: 12 }}>
                                    <FontAwesomeIcon color={Colors(theme).text} icon={faFilter} size={24} />
                                </Pressable>}
                        </View>
                    </View>,
                }}
            />
            <Tabs.Screen
                name="collaborations"
                options={{
                    title: "Campaigns",
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faStarSolid : faStar}
                            size={22}
                        />
                    ),
                    headerRight: () => <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <NotificationIcon />
                    </View>,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "My Brand",
                    tabBarIcon: () => <ProfileIcon />,
                    headerRight: () => (<View style={{ flexDirection: "row", alignItems: "center", }}>
                        {xl && <InfluencerConnects />}
                        <Pressable
                            style={{ paddingHorizontal: 16, }}
                            onPress={() => {
                                if (selectedBrand?.id) {
                                    navigator.clipboard.writeText(selectedBrand.id);
                                    Toaster.success("Brand ID copied!", "Share this with customer support if asked for")
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faCopy} size={20} color={Colors(theme).text} />
                        </Pressable>
                        {!xl && <Pressable style={{ paddingHorizontal: 16 }} onPress={() => router.push('/profile')}>
                            <ImageComponent
                                url={manager?.profileImage || ""}
                                initials={manager?.name}
                                shape="circle"
                                size="small"
                                altText="Image"
                                style={{ width: 40, height: 40 }}
                            />
                        </Pressable>}
                    </View>)
                }}
            />
        </Tabs>
    );
};

export default TabLayout;
