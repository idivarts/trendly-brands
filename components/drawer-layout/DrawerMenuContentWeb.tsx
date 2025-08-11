import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import ImageComponent from "@/shared-uis/components/image-component";
import {
  faComment,
  faEye,
  faFileLines,
  faHeart,
  faStar,
} from "@fortawesome/free-regular-svg-icons";
import {
  faChevronRight,
  faComment as faCommentSolid,
  faCreditCard,
  faHeart as faHeartSolid,
  faPlus,
  faSliders,
  faStar as faStarSolid,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { Theme, useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandSwitcher, { OpenBrandSwitcher } from "../ui/brand-switcher";
import DrawerMenuItem, { DrawerIcon, IconPropFn, Tab } from "./DrawerMenuItem";
// import BrandActionItem from "./BrandActionItem";
// Bottom menu items factory
const BOTTOM_MENU_ITEMS = (theme: Theme, name?: string, profileImage?: string): Tab[] => [
  {
    href: "/onboarding-your-brand",
    icon: () => <DrawerIcon href="/onboarding-your-brand" icon={faPlus} />,
    label: "Create New Brand",
  },
  {
    href: "/profile",
    icon: () => (
      <ImageComponent
        url={profileImage || ""}
        initials={name}
        shape="circle"
        size="small"
        altText="Image"
        style={{ width: 24, height: 24 }}
      />
    ),
    label: name || "Profile",
  },
];
// Brand Details menu items
const BRAND_DETAILS_MENU_ITEMS = (theme: Theme): Tab[] => [
  {
    href: "/preferences",
    icon: () => <DrawerIcon href="" icon={faSliders} />,
    label: "Influencer Preferences",
  },
  {
    href: "/brand-profile",
    icon: () => <DrawerIcon href="" icon={faFileLines} />,
    label: "Brand Profile",
  },
  {
    href: "/members",
    icon: () => <DrawerIcon href="" icon={faUsers} />,
    label: "Members",
  },
  {
    href: "/billing",
    icon: () => <DrawerIcon href="" icon={faCreditCard} />,
    label: "Billing",
  },
];

interface DrawerMenuContentProps { }

const CAMPAIGN_MENU_ITEMS = (theme: Theme): Tab[] => [
  {
    href: "/explore-influencers",
    icon: ({ focused }: IconPropFn) =>
      focused ? (
        <DrawerIcon href="/explore-influencers" icon={faHeartSolid} />
      ) : (
        <DrawerIcon href="/explore-influencers" icon={faHeart} />
      ),
    label: "Explore Influencers",
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
    showUnreadCount: true,
  },
  {
    href: "/contracts",
    icon: () => <DrawerIcon href="/contracts" icon={faFileLines} />,
    label: "Contracts",
  },
  {
    href: "/applications",
    icon: () => <DrawerIcon href="/applications" icon={faEye} />,
    label: "View All Applications",
  },
];

const DrawerMenuContentWeb: React.FC<DrawerMenuContentProps> = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { selectedBrand } = useBrandContext();
  const { manager } = useAuthContext();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: Platform.OS === "web" ? 8 : 64,
        backgroundColor: Colors(theme).background,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingBottom: 12,
          borderBottomColor: Colors(theme).border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Pressable
          onPress={() => {
            OpenBrandSwitcher.next(undefined);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                paddingVertical: 10,
                flex: 1,
                color: Colors(theme).text,
              }}
            >
              {selectedBrand?.name ?? "Brand"}
            </Text>
            {/* Quick switcher (if available on layout) */}
            <BrandSwitcher />
          </View>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 12,
          paddingHorizontal: 8,
          gap: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaigns Section */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              opacity: 0.7,
              paddingHorizontal: 8,
              color: Colors(theme).text,
            }}
          >
            Campaigns
          </Text>
          <View style={{ gap: 2 }}>
            {CAMPAIGN_MENU_ITEMS(theme).map((tab, idx) => (
              <DrawerMenuItem key={`campaign-${idx}`} tab={tab} />
            ))}
          </View>
        </View>

        {/* Promotional Banner */}
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            padding: 16,
            marginHorizontal: 8,
            marginBottom: 12,
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            You’re on the Free Plan
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Upgrade now to keep your community access
          </Text>
          <Pressable
            onPress={() => router.push("/billing")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              alignSelf: 'flex-start',
            })}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              Upgrade Now
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Brand Details Section */}
        <View style={{ marginTop: 16, gap: 8 }}>
          <Pressable
            onPress={() => {
              router.push("/menu")
            }}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
          >
            <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -10, paddingHorizontal: 8, paddingVertical: 12 }, isHovered && { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors(theme).border }]}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  opacity: 0.7,
                  color: Colors(theme).text,
                }}
              >
                Brand Details
              </Text>
              <DrawerIcon icon={faChevronRight} size={12} />
            </View>
          </Pressable>

          <View
            style={{
              borderTopColor: Colors(theme).border,
              borderTopWidth: StyleSheet.hairlineWidth,
            }}
          />
          <View style={{ gap: 0 }}>
            {BRAND_DETAILS_MENU_ITEMS(theme).map((tab, idx) => (
              <DrawerMenuItem key={`brand-details-${idx}`} tab={tab} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingTop: 4,
          paddingBottom: bottom,
          borderTopColor: Colors(theme).border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 4,
        }}
      >
        {BOTTOM_MENU_ITEMS(theme, manager?.name, manager?.profileImage).map((tab, idx) => (
          <DrawerMenuItem key={`bottom-${idx}`} tab={tab} />
        ))}
      </View>
    </View>
  );
};

export default DrawerMenuContentWeb;