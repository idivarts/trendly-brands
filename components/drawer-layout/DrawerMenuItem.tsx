import Colors from "@/constants/Colors";
import { useChatContext } from "@/contexts";
import { useTheme } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { Badge } from "react-native-paper";
import { Text, View } from "../theme/Themed";

export interface IconPropFn {
  focused: boolean;
}

type Tab = {
  href: string;
  icon: (props: IconPropFn) => JSX.Element;
  label: string;
  showUnreadCount?: boolean;
};

type DrawerMenuItemProps = {
  tab: Tab;
};

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({ tab }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { unreadCount } = useChatContext()

  const isActive = tab.href.includes(pathname);
  const colorSet = Colors(theme);

  return (
    <Pressable
      // @ts-ignore
      onPress={() => router.push(tab.href)}
      android_ripple={{ color: colorSet.primary + "30" }}
      style={[
        styles.wrapper,
        {
          backgroundColor: isActive
            ? colorSet.primary
            : colorSet.background,
          borderColor: isActive
            ? colorSet.primary
            : colorSet.background,
          // shadowColor: isActive ? "#000" : "transparent",
        },
      ]}
    >
      <View style={styles.innerContainer}>
        {tab.icon({ focused: isActive })}
        <Text
          style={[
            styles.label,
            {
              color: isActive ? colorSet.white : colorSet.text,
              fontWeight: isActive ? "600" : "400",
            },
          ]}
        >
          {tab.label}
        </Text>
        {tab.showUnreadCount && unreadCount > 0 && (
          <Badge
            visible={true}
            size={24}
            selectionColor={Colors(theme).red}
            style={{
              backgroundColor: Colors(theme).red,
            }}
          >
            {unreadCount}
          </Badge>)}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  innerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "transparent"
  },
  label: {
    fontSize: 16,
  },
});

export default DrawerMenuItem;