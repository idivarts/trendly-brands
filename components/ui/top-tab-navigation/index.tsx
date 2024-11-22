import { useTheme } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { stylesFn } from '@/styles/top-tab-navigation/TopTabNavigation.styles';

interface TopTabNavigationProps {
  tabs: {
    id: string;
    title: string;
    component: React.ReactNode;
  }[];
  size?: "compact" | "default";
}

const TopTabNavigation: React.FC<TopTabNavigationProps> = ({
  tabs,
  size = "default",
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [tabLayout, setTabLayout] = useState<any>({});
  const prevTabIndex = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const styles = stylesFn(theme);

  useEffect(() => {
    setActiveTab(tabs[0]);
  }, [tabs]);

  const renderTabContent = () => {
    let content

    content = activeTab.component;

    return (
      <View
        style={[
          styles.tabContent,
        ]}
      >
        {content}
      </View>
    )
  }

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
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabScroll,
          size === "compact" && styles.compactTabScroll,
        ]}
        contentContainerStyle={styles.tabScrollContainer}
      >
        <View
          style={styles.tabContainer}
        >
          {tabs.map((tab, index) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                size === "compact" && styles.compactTab,
                {
                  backgroundColor: activeTab === tab ? Colors(theme).primary : 'transparent',
                }
              ]}
              onPress={() => {
                const newTabIndex = tabs.findIndex(t => t.id === tab.id);
                prevTabIndex.current = tabs.findIndex(t => t.id === activeTab.id);
                setActiveTab(tab);
                scrollToTab(newTabIndex);
              }}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout
                setTabLayout((prev: any) => ({
                  ...prev,
                  [tab.id]: { width: layout.width, x: layout.x }
                }))
              }}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
                size === "compact" && styles.compactText,
              ]}>
                {tab.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {renderTabContent()}
    </View>
  )
}

export default TopTabNavigation;
