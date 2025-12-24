import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { DrawerActions, useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Platform, Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import DrawerToggleButton from "../ui/drawer-toggle-button/DrawerToggleButton";

const Header: React.FC = (props) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const navigation = useNavigation();

    const { selectedBrand } = useBrandContext();

    return (
        <Pressable
            onPress={() => xl ? null : navigation.dispatch(DrawerActions.openDrawer())}>
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
                    {Platform.OS === "web" ? (xl ? "Influencer Spotlights" : "Spotlights") : selectedBrand?.name ?? "Brand"}
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

export default Header;
