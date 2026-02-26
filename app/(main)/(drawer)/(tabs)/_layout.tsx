import { router, Tabs } from "expo-router";
import React from "react";

import DiscoverHeader from "@/components/discover/DiscoverHeader";
import { PremiumActionTag } from "@/components/discover/components/PremiumActionTag";
import { OpenFilterRightPanel } from "@/components/discover/discovery-context";
import Header from "@/components/explore-influencers/header";
import InfluencerConnects from "@/components/explore-influencers/InfluencerConnects";
import ProfileIcon from "@/components/explore-influencers/profile-icon";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import Colors from "@/shared-uis/constants/Colors";
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
import * as Clipboard from "expo-clipboard";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Badge } from "react-native-paper";

const useStyles = (theme: ReturnType<typeof useTheme>, xl: boolean) =>
    StyleSheet.create({
        headerRightRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
        },
        headerRightRowSimple: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        filterButton: {
            marginLeft: 12,
        },
        menuHeaderRow: {
            flexDirection: "row",
            alignItems: "center",
        },
        copyButton: {
            paddingHorizontal: 16,
        },
        profileAvatar: {
            width: 40,
            height: 40,
        },
        badge: {
            backgroundColor: Colors(theme).red,
            zIndex: 1,
            position: "absolute",
            top: 0,
            right: 20,
        },
    });

const TabLayout = () => {
    const { xl } = useBreakpoints();
    const theme = useTheme();
    const styles = React.useMemo(() => useStyles(theme, xl), [theme, xl]);
    const { unreadCount } = useChatContext()
    const { manager } = useAuthContext();
    const { selectedBrand } = useBrandContext()
    const influencerCredits = selectedBrand?.credits?.influencer || (IS_MONETIZATION_DONE ? 0 : 1000)

    const copyBrandId = async () => {
        if (!selectedBrand?.id) {
            return;
        }

        try {
            if (Platform.OS === "web") {
                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(selectedBrand.id);
                } else {
                    await Clipboard.setStringAsync(selectedBrand.id);
                }
            } else {
                await Clipboard.setStringAsync(selectedBrand.id);
            }
            Toaster.success("Brand ID copied!", "Share this with customer support if asked for");
        } catch {
            Toaster.error("Failed to copy Brand ID");
        }
    };

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
                        <View style={styles.headerRightRow}>
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
                                    style={styles.badge}
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                        </>
                    ),
                    title: "Messages",
                    headerTitleAlign: "left",
                    headerRight: () => <View style={styles.headerRightRowSimple}>
                        <NotificationIcon />
                    </View>,
                }}
            />

            <Tabs.Screen
                name="discover"
                options={{
                    title: xl ? "Discover Influencers" : "Discover",
                    headerTitle: () => <DiscoverHeader />,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faGemSolid : faGem}
                            size={22}
                        />
                    ),
                    headerRight: () => (
                        <View style={styles.headerRightRowSimple}>
                            <Pressable
                                onPress={() => OpenFilterRightPanel.next()}
                                style={styles.filterButton}
                            >
                                <FontAwesomeIcon
                                    color={Colors(theme).text}
                                    icon={faFilter}
                                    size={24}
                                />
                            </Pressable>
                        </View>
                    ),
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
                    headerRight: () => <View style={styles.headerRightRowSimple}>
                        <NotificationIcon />
                    </View>,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "My Brand",
                    tabBarIcon: () => <ProfileIcon />,
                    headerRight: () => (<View style={styles.menuHeaderRow}>
                        {xl && <InfluencerConnects />}
                        <Pressable
                            style={styles.copyButton}
                            onPress={() => {
                                copyBrandId();
                            }}
                        >
                            <FontAwesomeIcon icon={faCopy} size={20} color={Colors(theme).text} />
                        </Pressable>
                        {!xl && <Pressable style={styles.copyButton} onPress={() => router.push('/profile')}>
                            <ImageComponent
                                url={manager?.profileImage || ""}
                                initials={manager?.name}
                                shape="circle"
                                size="small"
                                altText="Image"
                                style={styles.profileAvatar}
                            />
                        </Pressable>}
                    </View>)
                }}
            />
        </Tabs>
    );
};

export default TabLayout;
