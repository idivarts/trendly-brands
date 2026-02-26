import Colors from "@/shared-uis/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { Platform, Pressable } from "react-native";
import { Text, View } from "@/components/theme/Themed";
import DrawerToggleButton from "@/components/ui/drawer-toggle-button/DrawerToggleButton";

const DiscoverHeader: React.FC = () => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const { selectedBrand } = useBrandContext();

    return (
        <Pressable
            onPress={() => {
                if (!xl) {
                    OpenDrawerSubject.next(true);
                }
            }}
        >
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: Colors(theme).text,
                        fontSize: 22,
                        fontWeight: 600,
                    }}
                >
                    {Platform.OS === "web"
                        ? xl
                            ? "Discover Influencers"
                            : "Discover"
                        : selectedBrand?.name ?? "Brand"}
                </Text>
                <Pressable>
                    {xl ? null : (
                        <DrawerToggleButton
                            icon={
                                <FontAwesomeIcon
                                    color={Colors(theme).text}
                                    icon={faChevronDown}
                                    size={16}
                                    style={{
                                        marginLeft: 6,
                                        marginBottom: -2,
                                    }}
                                />
                            }
                        />
                    )}
                </Pressable>
            </View>
        </Pressable>
    );
};

export default DiscoverHeader;
