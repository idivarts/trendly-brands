import Colors from "@/shared-uis/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme, type Theme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Text, View } from "../theme/Themed";
import DrawerToggleButton from "../ui/drawer-toggle-button/DrawerToggleButton";
import { OpenDrawerSubject } from "@/shared-uis/components/CustomDrawer";

const Header: React.FC = (props) => {
    const theme = useTheme();
    const { xl } = useBreakpoints();
    const styles = useStyles(theme);
    const { selectedBrand } = useBrandContext();

    return (
        <Pressable
            onPress={() => {
                if (!xl) {
                    OpenDrawerSubject.next(true);
                }
            }}>
            <View style={styles.row}>
                <Text style={styles.title}>
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
                                    style={styles.chevronIcon}
                                />
                            }
                        />
                    )}
                </Pressable>
            </View>
        </Pressable>
    );
};

function useStyles(theme: Theme) {
    return StyleSheet.create({
        row: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
        },
        title: {
            color: Colors(theme).text,
            fontSize: 22,
            fontWeight: "600",
        },
        chevronIcon: {
            marginLeft: 6,
            marginBottom: -2,
        },
    });
}

export default Header;
