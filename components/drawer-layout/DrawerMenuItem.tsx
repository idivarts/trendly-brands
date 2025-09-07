import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Href, usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Badge } from "react-native-paper";
import { Text, View } from "../theme/Themed";

export interface IconPropFn {
  focused: boolean;
}

export type Tab = {
  href: Href;
  icon: (props: IconPropFn) => JSX.Element;
  label: string;
  showUnreadCount?: boolean;
  pro?: boolean;
};

type DrawerMenuItemProps = {
  tab: Tab;
  proLock?: boolean
};

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({ tab, proLock }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { unreadCount } = useChatContext();
  const [hovered, setHovered] = useState(false);

  // Avoid marking blank href items as active
  const isActive = !!tab.href && pathname.startsWith(tab.href.toString());
  const colorSet = Colors(theme);

  return (
    <Pressable
      onPress={() => {
        if (tab.href) router.push(tab.href);
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      android_ripple={{ color: colorSet.primary + "22" }}
      style={({ pressed }) => [
        styles.wrapper,
        {
          // Backgrounds
          backgroundColor: isActive
            ? colorSet.primary
            : pressed || hovered
              ? colorSet.background + "F2"
              : colorSet.background,
          // Borders: only on active or hover
          borderWidth: isActive || hovered ? StyleSheet.hairlineWidth : 0,
          borderColor: isActive ? colorSet.primary : colorSet.border,
          // Active accent on the left
          borderLeftWidth: isActive ? 3 : 0,
          borderLeftColor: isActive ? colorSet.white : "transparent",
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
    >
      <View style={styles.innerContainer}>
        {tab.icon({ focused: isActive })}
        <Text
          style={[
            styles.label,
            { color: isActive ? colorSet.white : colorSet.text, fontWeight: isActive ? "600" : "500" },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
        {proLock && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colorSet.border,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
              marginLeft: 6,
            }}
          >
            <FontAwesomeIcon icon={faLock} size={10} color={colorSet.text} style={{ marginRight: 4 }} />
            <Text style={{ color: colorSet.text, fontSize: 11, fontWeight: '500' }}>
              Upgrade to Pro
            </Text>
          </View>
        )}
        {tab.showUnreadCount && unreadCount > 0 && (
          <Badge
            visible={true}
            size={16}
            selectionColor={Colors(theme).red}
            style={{
              backgroundColor: Colors(theme).red,
              minWidth: 16,
              alignSelf: "center",
            }}
          >
            {unreadCount}
          </Badge>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  innerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
});

interface DrawerIconProps {
  href?: string;
  icon: IconProp;
  size?: number
}

const DrawerIcon: React.FC<DrawerIconProps> = ({ href, icon, size = 20 }) => {
  const theme = useTheme();
  const pathname = usePathname();

  const active = !!href && pathname.startsWith(href);

  return (
    <FontAwesomeIcon
      icon={icon}
      color={active ? Colors(theme).white : Colors(theme).text}
      size={size}
    />
  );
};

export default DrawerMenuItem;
export { DrawerIcon };
