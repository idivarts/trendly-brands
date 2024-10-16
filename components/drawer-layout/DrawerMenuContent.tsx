import { Text, View } from "@/components/theme/Themed";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { APP_NAME } from "@/constants/App";
import DrawerMenuItem from "./DrawerMenuItem";
import { useBreakpoints } from "@/hooks";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = [
  {
    href: "/explore-influencers",
    label: "Explore Influencers",
  },
  {
    href: "/collaborations",
    label: "Collaborations",
  },
  {
    href: "/create-collaboration",
    label: "Create Collaboration",
  },
  {
    href: "/messages",
    label: "Messages",
  },
  {
    href: "/contracts",
    label: "Contracts",
  },
];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <DrawerContentScrollView>
        <View
          style={{
            flex: 1,
            gap: 6,
          }}
        >
          <View>
            <Text
              style={{
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 16,
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              {APP_NAME}
            </Text>
          </View>
          <View>
            {xl && DRAWER_MENU_CONTENT_ITEMS.map((tab, index) => (
              <DrawerMenuItem
                key={index}
                tab={tab}
              />
            ))}
          </View>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default DrawerMenuContent;
