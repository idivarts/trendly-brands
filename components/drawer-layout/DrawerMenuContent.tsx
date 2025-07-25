import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import ImageComponent from "@/shared-uis/components/image-component";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { Brand } from "@/types/Brand";
import {
  faComment,
  faEye,
  faFileLines,
  faHeart,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faComment as faCommentSolid,
  faHeart as faHeartSolid,
  faPlus,
  faStar as faStarSolid
} from "@fortawesome/free-solid-svg-icons";
import { DrawerActions, Theme, useTheme } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileIcon from "../explore-influencers/profile-icon";
import BrandSwitcher, { OpenBrandSwitcher } from "../ui/brand-switcher";
import BrandActionItem from "./BrandActionItem";
import BrandItem from "./BrandItem";
import DrawerIcon from "./DrawerIcon";
import DrawerMenuItem, { IconPropFn } from "./DrawerMenuItem";

interface DrawerMenuContentProps { }

const DRAWER_MENU_CONTENT_ITEMS = (theme: Theme) => [
  {
    href: "/explore-influencers",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/explore-influencers" icon={faHeartSolid} />
      ) : (
        <DrawerIcon href="/explore-influencers" icon={faHeart} />
      ),
    label: "Explore",
  },
  {
    href: "/collaborations",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/collaborations" icon={faStarSolid} />
      ) : (
        <DrawerIcon href="/collaborations" icon={faStar} />
      ),
    label: "Collaborations",
  },
  {
    href: "/messages",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/messages" icon={faCommentSolid} />
      ) : (
        <DrawerIcon href="/messages" icon={faComment} />
      ),
    label: "Messages",
    showUnreadCount: true
  },
  {
    href: "/contracts",
    icon: () => <DrawerIcon href="/contracts" icon={faFileLines} />,
    label: "Contracts",
  },
  {
    href: "/menu",
    icon: ({ focused }: IconPropFn) => <ProfileIcon />,
    label: "My Brand",
  },
];

const DrawerMenuContent: React.FC<DrawerMenuContentProps> = () => {
  const { xl } = useBreakpoints();
  const navigation = useNavigation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = stylesFn(theme);
  const { brands, selectedBrand, setSelectedBrand } = useBrandContext();
  const { manager } = useAuthContext()

  const handleBrandChange = (brand: Brand) => {
    navigation.dispatch(DrawerActions.closeDrawer());
    setSelectedBrand(brand);
  };

  const filteredBrands = brands

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "web" ? 8 : 64,
        backgroundColor: Colors(theme).background,
      }}
    >
      {/* Header Section */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingBottom: 12,
          borderBottomColor: Colors(theme).border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Pressable onPress={() => {
          OpenBrandSwitcher.next(undefined)
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                paddingVertical: 10,
                paddingHorizontal: 16,
                flex: 1,
                color: Colors(theme).text,
              }}
            >
              {selectedBrand?.name ?? "Brand"}
            </Text>
            {xl && <BrandSwitcher />}
          </View>
        </Pressable>
      </View>

      {/* Scrollable Menu Section */}
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 12,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {xl
          ? DRAWER_MENU_CONTENT_ITEMS(theme).map((tab, index) => (
            <DrawerMenuItem key={index} tab={tab} />
          ))
          : filteredBrands.map((brand) => (
            <BrandItem
              active={selectedBrand?.id === brand.id}
              image={brand.image}
              key={brand.id.toString()}
              menu={true}
              onPress={() => handleBrandChange(brand)}
              showImage={true}
              title={brand.name}
            />
          ))}
      </ScrollView>

      {/* Bottom CTA Section */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: bottom + (Platform.OS === "android" ? 24 : 36),
          borderTopColor: Colors(theme).border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 12,
        }}
      >
        <BrandActionItem
          key="view-applications"
          icon={faEye}
          showChevron={false}
          onPress={() => {
            router.push({
              pathname: "/applications",
            });
            navigation.dispatch(DrawerActions.closeDrawer());
          }}
          title="View All Applications"
          removeBottomBorder={true}
        />
        <BrandActionItem
          key="create-brand"
          icon={faPlus}
          showChevron={false}
          onPress={() => {
            router.push({
              pathname: "/onboarding-your-brand",
            });
            navigation.dispatch(DrawerActions.closeDrawer());
          }}
          title="Create New Brand"
          removeTopBorder={true}
          removeBottomBorder={true}
        />
        <BrandActionItem
          key="view-profile"
          image={<ImageComponent
            url={manager?.profileImage || ""}
            initials={manager?.name}
            shape="circle"
            size="small"
            altText="Image"
            style={{ width: 30, height: 30 }}
          />}
          showChevron={false}
          onPress={() => {
            router.push({
              pathname: "/profile",
            });
            navigation.dispatch(DrawerActions.closeDrawer());
          }}
          title={manager?.name || "My Profile"}
          removeTopBorder={true}
          removeBottomBorder={true}
        />
        {/* <Pressable
          onPress={() => {
            router.push("/profile");
          }}
        >
          <View style={styles.userProfileContainer}>

            <View style={styles.textContainer}>
              <Text style={styles.titleText}>{manager?.name}</Text>
              <Text
                style={{
                  opacity: 0.8,
                }}
              >
                {manager?.email}
              </Text>
            </View>
            <FontAwesomeIcon
              color={Colors(theme).text}
              icon={faChevronRight}
              size={20}
              style={styles.chevron}
            />
          </View>
        </Pressable> */}
      </View>
    </View>
  );
};
export default DrawerMenuContent;