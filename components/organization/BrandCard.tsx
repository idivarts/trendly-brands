import { Text, View } from "@/components/theme/Themed";
import Tag from "@/components/ui/tag";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Avatar, Divider, IconButton, Menu } from "react-native-paper";

interface BrandCardProps {
    name: string;
    image?: string;
    isCurrent?: boolean;
    width: number;
    onPress: () => void;
    menuOpen: boolean;
    onOpenMenu: () => void;
    onDismissMenu: () => void;
    onMove: () => void;
    canMove: boolean;
    onDelete: () => void;
    onCopyId: () => void;
}

/**
 * Squarish brand tile for the organization grid — brand avatar + name with a
 * top-right kebab for move/delete. Reads like an app-launcher tile so brands
 * (the primary entity on this screen) get more visual weight than the member
 * rows beside them. Shadow-based lift, no borders, per the project UI rules.
 */
const BrandCard: React.FC<BrandCardProps> = ({
    name,
    image,
    isCurrent,
    width,
    onPress,
    menuOpen,
    onOpenMenu,
    onDismissMenu,
    onMove,
    canMove,
    onDelete,
    onCopyId,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}
        >
            {/* Kebab sits above the card's press target so its taps don't
                bubble into opening the brand. */}
            <View
                style={styles.menuAnchor}
                lightColor="transparent"
                darkColor="transparent"
                onStartShouldSetResponder={() => true}
            >
                <Menu
                    visible={menuOpen}
                    onDismiss={onDismissMenu}
                    anchor={
                        <IconButton
                            icon="dots-vertical"
                            size={20}
                            iconColor={colors.textSecondary}
                            onPress={onOpenMenu}
                            style={styles.kebabButton}
                        />
                    }
                >
                    <Menu.Item title="Copy brand ID" onPress={onCopyId} />
                    <Divider />
                    <Menu.Item title="Move to another organization" disabled={!canMove} onPress={onMove} />
                    <Divider />
                    <Menu.Item title="Delete" titleStyle={{ color: colors.red }} onPress={onDelete} />
                </Menu>
            </View>

            <Avatar.Image
                size={56}
                source={
                    image
                        ? { uri: image }
                        : require("@/assets/images/placeholder-image.jpg")
                }
                style={styles.avatar}
            />
            <Text style={styles.name} numberOfLines={2}>
                {name}
            </Text>
            {isCurrent ? (
                <Tag compact>Current</Tag>
            ) : (
                <Text style={styles.hint} numberOfLines={1}>
                    Tap to open
                </Text>
            )}
        </Pressable>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>) =>
    StyleSheet.create({
        card: {
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingVertical: 22,
            paddingHorizontal: 12,
            minHeight: 150,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        cardPressed: {
            opacity: 0.85,
        },
        menuAnchor: {
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 2,
        },
        kebabButton: {
            margin: 0,
        },
        avatar: {
            backgroundColor: colors.tag,
        },
        name: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            textAlign: "center",
        },
        hint: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: "center",
        },
    });

export default BrandCard;
