import { useTheme } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface IconPropFn {
  focused: boolean;
}

type Tab = {
  href: string;
  icon: IconProp | ((props: IconPropFn) => IconProp);
  label: string;
};

type DrawerMenuItemProps = {
  tab: Tab;
};

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({ tab }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  return (
    //@ts-ignore
    <Pressable onPress={() => router.push(tab.href)}>
      <View
        style={{
          backgroundColor: tab.href.includes(pathname)
            ? Colors(theme).primary
            : Colors(theme).background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: Colors(theme).aliceBlue,
          paddingHorizontal: 24,
          paddingVertical: 14,
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
          justifyContent: "flex-start"
        }}
      >
        <FontAwesomeIcon
          icon={
            typeof tab.icon === "function"
              ? tab.icon({ focused: tab.href.includes(pathname) })
              : tab.icon
          }
          color={
            tab.href.includes(pathname)
              ? Colors(theme).white
              : Colors(theme).text
          }
          size={28}
        />
        <Text
          style={{
            color: tab.href.includes(pathname)
              ? Colors(theme).white
              : Colors(theme).text,
            textAlign: "center",
            fontSize: 16,
          }}
        >
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
};

export default DrawerMenuItem;
