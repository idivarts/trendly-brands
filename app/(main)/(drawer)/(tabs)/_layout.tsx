import { Tabs } from "expo-router";
import React from "react";

import ProfileIcon from "@/components/explore-influencers/profile-icon";
import NotificationIcon from "@/components/notifications/notification-icon";
import { View } from "@/components/theme/Themed";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useAuthContext, useChatContext, useLocationContext } from "@/contexts";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { CoachmarkAnchor } from "@edwardloopez/react-native-coachmark";
import {
    faComment,
    faGem,
    faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
    faCalendarDays,
    faComment as faCommentSolid,
    faGem as faGemSolid,
    faPenRuler,
    faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { Badge } from "react-native-paper";

const useStyles = (theme: ReturnType<typeof useTheme>) =>
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
    const styles = React.useMemo(() => useStyles(theme), [theme]);
    const { unreadCount } = useChatContext();
    const { isIndiaBased } = useLocationContext();
    const { manager } = useAuthContext();

    // 4th dynamic tab logic:
    // India + not chat connected → show Discover
    // India + chat connected OR outside India → show Messages
    const showDiscover = isIndiaBased && !manager?.isChatConnected;

    const menuTabButton = () =>
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
            {/* Tab 1: Content Strategy (index) */}
            <Tabs.Screen
                name="(content)/content-strategies/index"
                options={{
                    title: "Strategy",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faPenRuler}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Hidden: content-strategies detail route */}
            <Tabs.Screen
                name="(content)/content-strategies/[strategyId]"
                options={{
                    tabBarItemStyle: { display: "none" },
                    headerShown: false,
                }}
            />

            {/* Tab 2: Content Calendar */}
            <Tabs.Screen
                name="(content)/content-calendar"
                options={{
                    title: "Calendar",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={faCalendarDays}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Tab 3: Collaboration Requests */}
            <Tabs.Screen
                name="collaborations"
                options={{
                    title: "Collabs",
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
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
                    ),
                }}
            />

            {/* Tab 4a: Discover (India + not chat connected) */}
            <Tabs.Screen
                name="discover"
                options={{
                    title: "Discover",
                    headerShown: false,
                    tabBarItemStyle: { display: showDiscover ? "flex" : "none" },
                    tabBarIcon: ({ color, focused }) => (
                        <FontAwesomeIcon
                            color={color}
                            icon={focused ? faGemSolid : faGem}
                            size={22}
                        />
                    ),
                }}
            />

            {/* Tab 4b: Messages (India + chat connected, or outside India) */}
            <Tabs.Screen
                name="messages"
                options={{
                    tabBarItemStyle: { display: showDiscover ? "none" : "flex" },
                    tabBarIcon: ({ color, focused }) => (
                        <>
                            <FontAwesomeIcon
                                color={color}
                                icon={focused ? faCommentSolid : faComment}
                                size={22}
                            />
                            {unreadCount > 0 && (
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

            {/* Tab 5: Brand Menu */}
            <Tabs.Screen
                name="menu"
                options={{
                    title: "My Brand",
                    headerShown: false,
                    tabBarIcon: () => menuTabButton(),
                }}
            />

            {/* Hidden: contents list + detail (not in tab bar) */}
            <Tabs.Screen
                name="(content)/contents/index"
                options={{
                    tabBarItemStyle: { display: "none" },
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="(content)/contents/[contentId]"
                options={{
                    tabBarItemStyle: { display: "none" },
                    headerShown: false,
                }}
            />
        </Tabs>
    );
};

export default TabLayout;
