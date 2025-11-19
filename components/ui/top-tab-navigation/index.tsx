import Colors from "@/constants/Colors";
import { useBreakpoints } from "@/hooks";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { stylesFn } from "@/styles/top-tab-navigation/TopTabNavigation.styles";
import { useTheme } from "@react-navigation/native";
import { Href } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useCollapseContext } from "@/contexts/CollapseContext";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Divider, IconButton } from "react-native-paper";

interface TopTabNavigationProps {
  tabs: {
    id: string;
    title: string;
    icon?: any;
    component?: React.ReactNode;
    href?: Href;
  }[];
  size?: "compact" | "default";
  mobileFullWidth?: boolean;
  splitTwoColumns?: boolean;
  defaultSelection?: number;
}

const TopTabNavigation: React.FC<TopTabNavigationProps> = ({
  tabs,
  size = "default",
  mobileFullWidth = false,
  splitTwoColumns = true,
  defaultSelection = 0,
}) => {
  const router = useMyNavigation();
  const { isCollapsed, setIsCollapsed } = useCollapseContext();
  const [activeTab, setActiveTab] = useState(tabs[defaultSelection]);
  const [tabLayout, setTabLayout] = useState<any>({});
  const prevTabIndex = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const styles = stylesFn(theme);

  const collapseAnim = useRef(new Animated.Value(1)).current;
  const autoCollapseTimer = useRef<NodeJS.Timeout>();

  // Auto-collapse after 2 seconds of inactivity
  const startAutoCollapseTimer = () => {
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
    }
    autoCollapseTimer.current = setTimeout(() => {
      handleCollapse(true);
    }, 2000);
  };

  const handleCollapse = (collapse: boolean) => {
    setIsCollapsed(collapse);
    Animated.timing(collapseAnim, {
      toValue: collapse ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
    };
  }, []);
  const { xl: xlRaw } = useBreakpoints();
  const xl = splitTwoColumns && xlRaw;

  useEffect(() => {
    setActiveTab(tabs[defaultSelection]);
  }, [tabs]);

  const renderTabContent = () => {
    let content;

    content = activeTab.component;

    return (
      <View style={[styles.tabContent, xl && { flex: 1, height: "100%" }]}>
        {content}
      </View>
    );
  };

  const scrollToTab = (index: number) => {
    if (scrollViewRef.current && tabLayout[tabs[index].id]) {
      scrollViewRef.current.scrollTo({
        x: tabLayout[tabs[index].id].x - 16,
        animated: true,
      });
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: xl ? "row" : "column",
        },
      ]}
    >
      <Animated.View
        style={{
          position: "relative",
          width: xl
            ? collapseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 300],
              })
            : "100%",
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal={!xl}
          showsHorizontalScrollIndicator={false}
          style={[
            styles.tabScroll,
            size === "compact" && styles.compactTabScroll,
            !xl && mobileFullWidth && styles.mobileTabScroll,
            // @ts-ignore
            xl && {
              width: "100%",
              height: "100%",
              alignSelf: "stretch",
              maxHeight: "unset",
            },
          ]}
          contentContainerStyle={[styles.tabScrollContainer]}
          onTouchStart={() => {
            if (autoCollapseTimer.current) {
              clearTimeout(autoCollapseTimer.current);
            }
          }}
          onTouchEnd={() => {
            startAutoCollapseTimer();
          }}
        >
          <Animated.View
            style={[
              styles.tabContainer,
              xl && {
                flexDirection: "column",
                alignSelf: "stretch",
                justifyContent: "flex-start",
                paddingTop: 16,
                minHeight: Dimensions.get("window").height * 0.8,
                paddingHorizontal: 16,
                opacity: collapseAnim,
              },
            ]}
          >
            {tabs.map((tab, index) =>
              tab.title == "---" ? (
                <Divider />
              ) : (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.tab,
                    size === "compact" && styles.compactTab,
                    {
                      backgroundColor:
                        activeTab === tab
                          ? Colors(theme).primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    const newTabIndex = tabs.findIndex((t) => t.id === tab.id);
                    prevTabIndex.current = tabs.findIndex(
                      (t) => t.id === activeTab.id
                    );
                    if (tab.component) {
                      setActiveTab(tab);
                    } else if (tab.href) {
                      router.push(tab.href);
                    }
                    scrollToTab(newTabIndex);
                  }}
                  onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    setTabLayout((prev: any) => ({
                      ...prev,
                      [tab.id]: { width: layout.width, x: layout.x },
                    }));
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                      size === "compact" && styles.compactText,
                    ]}
                  >
                    {tab.title}
                  </Text>
                </Pressable>
              )
            )}
          </Animated.View>
        </ScrollView>
        {xl && (
          <Animated.View
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: [{ translateY: -20 }],
              opacity: collapseAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0, 1],
              }),
            }}
          >
            <IconButton
              icon={isCollapsed ? "chevron-right" : "chevron-left"}
              mode="contained"
              containerColor={Colors(theme).primary}
              iconColor="white"
              size={20}
              onPress={() => {
                if (autoCollapseTimer.current) {
                  clearTimeout(autoCollapseTimer.current);
                }
                handleCollapse(!isCollapsed);
                if (!isCollapsed) {
                  startAutoCollapseTimer();
                }
              }}
            />
          </Animated.View>
        )}
      </Animated.View>

      {renderTabContent()}
    </View>
  );
};

export default TopTabNavigation;
