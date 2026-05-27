import { Text, View } from "@/components/theme/Themed";
import { useAuthContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";
import ImageComponent from "@/shared-uis/components/image-component";
import Colors from "@/shared-uis/constants/Colors";
import { Brand } from "@/types/Brand";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandActionItem from "./BrandActionItem";
import BrandItem from "./BrandItem";

interface DrawerMenuContentMobileProps { }

const DrawerMenuContentMobile: React.FC<DrawerMenuContentMobileProps> = () => {
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const { brands, selectedBrand, setSelectedBrand } = useBrandContext();
    const { manager } = useAuthContext();
    const filteredBrands = brands;

    const handleBrandChange = (brand: Brand) => {
        OpenDrawerSubject.next(false);
        setSelectedBrand(brand);
    };

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
                </View>
            </View>

            {/* Scrollable Menu Section */}
            <ScrollView
                contentContainerStyle={{
                    paddingVertical: 12,
                    gap: 10,
                }}
                showsVerticalScrollIndicator={false}
            >
                {filteredBrands.map((brand) => (
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
                    key="create-brand"
                    icon={faPlus}
                    showChevron={false}
                    onPress={() => {
                        router.push({
                            pathname: "/onboarding-your-brand",
                        });
                        OpenDrawerSubject.next(false);
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
                        initialsSize={12}
                        style={{ width: 30, height: 30 }}
                    />}
                    showChevron={false}
                    onPress={() => {
                        router.push({
                            pathname: "/profile",
                        });
                        OpenDrawerSubject.next(false);
                    }}
                    title={manager?.name || "My Profile"}
                    removeTopBorder={true}
                    removeBottomBorder={true}
                />
            </View>
        </View>
    );
};

export default DrawerMenuContentMobile;
