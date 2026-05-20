import { Tabs } from "expo-router";
import React from "react";

import ProfileIcon from "@/components/explore-influencers/profile-icon";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useChatContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import {
    faComment,
    faGem,
    faHeart,
    faStar
} from "@fortawesome/free-regular-svg-icons";
import {
    faComment as faCommentSolid,
    faGem as faGemSolid,
    faHeart as faHeartSolid,
    faStar as faStarSolid
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { Badge } from "react-native-paper";

const useStyles = (theme: ReturnType<typeof useTheme>, xl: boolean) =>
    StyleSheet.create({
        headerRightRowSimple: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
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
    const { unreadCount } = useChatContext();

    const campaignsTabButton = (color: string, focused: boolean) =>
        !xl ? (
            <CoachmarkAnchor
                id="guide-tour-campaigns-mobile"
                shape="pill"
                style={{ flex: 1 }}
            >
                <FontAwesomeIcon
                    color={color}
                    icon={focused ? faStarSolid : faStar}
                    size={22}
                />
            </CoachmarkAnchor>
        ) : (
            <FontAwesomeIcon
                color={color}
                icon={focused ? faStarSolid : faStar}
                size={22}
            />
        );

    const menuTabButton = (color: string, focused: boolean) =>
        !xl ? (
            <CoachmarkAnchor
                id="guide-tour-menu-mobile"
                shape="pill"
                style={{ flex: 1 }}
            >
                <ProfileIcon />
            </CoachmarkAnchor>
        ) : (
            <ProfileIcon />
        );

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
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faHeartSolid : faHeart}
                            size={22}
                        />
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
                    headerRight: () => (
                        <View style={styles.headerRightRowSimple}>
                            <NotificationIcon />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="discover"
                options={{
                    title: xl ? "Discover Influencers" : "Discover",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faGemSolid : faGem}
                            size={22}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="campaigns"
                options={{
                    title: "Campaigns",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => campaignsTabButton(color, focused),
                }}
            />
            {/* Deprecated: kept for reference, hidden from tab bar */}
            <Tabs.Screen
                name="collaborations"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "My Brand",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => menuTabButton(color, focused),
                }}
            />
        </Tabs>
    );
};

export default TabLayout;
