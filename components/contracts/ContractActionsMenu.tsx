import Colors from "@/shared-uis/constants/Colors";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../theme/Themed";
import ContractActionOverlay from "./ContractActionOverlay";

export interface ContractActionsMenuItem {
    label: string;
    onPress: () => void;
    destructive?: boolean;
}

interface ContractActionsMenuProps {
    items: ContractActionsMenuItem[];
}

const ContractActionsMenu: React.FC<ContractActionsMenuProps> = ({ items }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [sheetVisible, setSheetVisible] = useState(false);

    if (items.length === 0) return null;

    return (
        <>
            <Pressable
                style={({ pressed }) => [styles.triggerButton, pressed && styles.triggerButtonPressed]}
                onPress={() => setSheetVisible(true)}
                hitSlop={8}
            >
                <FontAwesomeIcon icon={faEllipsis} size={18} color={colors.text} />
            </Pressable>

            <ContractActionOverlay
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                mode="bottomSheet"
                snapPointsRange={["25%", `${Math.min(80, 18 + items.length * 14)}%`]}
            >
                <View style={styles.sheet}>
                    {items.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && styles.menuItemPressed,
                                ]}
                                onPress={() => {
                                    setSheetVisible(false);
                                    setTimeout(item.onPress, 150);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.menuItemLabel,
                                        item.destructive && styles.menuItemDestructive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </Pressable>
                            {index < items.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>
            </ContractActionOverlay>
        </>
    );
};

export default ContractActionsMenu;

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        triggerButton: {
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
        },
        triggerButtonPressed: {
            backgroundColor: colors.secondarySurface,
        },
        sheet: {
            paddingVertical: 8,
            paddingHorizontal: 4,
            backgroundColor: colors.background,
        },
        menuItem: {
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderRadius: 8,
        },
        menuItemPressed: {
            backgroundColor: colors.secondarySurface,
        },
        menuItemLabel: {
            fontSize: 16,
            fontWeight: "500",
            color: colors.text,
        },
        menuItemDestructive: {
            color: colors.errorBannerText,
        },
        divider: {
            height: 1,
            backgroundColor: colors.secondaryBorder,
            marginHorizontal: 16,
        },
    });
}
