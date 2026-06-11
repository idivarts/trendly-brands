import Colors from "@/shared-uis/constants/Colors";
import { faCopy, faEllipsis, faShareNodes, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet } from "react-native";
import { Menu } from "react-native-paper";

interface StrategyActionsMenuProps {
    onDuplicate: () => void;
    onDelete: () => void;
    /** Opens the public share modal. Omit to hide the Share item. */
    onShare?: () => void;
    /** Tint for the kebab trigger icon. Defaults to secondary text. */
    iconColor?: string;
}

/**
 * Horizontal triple-dot menu for a single strategy row. Lives inside the row's
 * Pressable, so it stops propagation on open to keep the row from navigating.
 * Surfaces the quick actions: Share (public link), Duplicate (clone into an
 * editable copy) and Delete (destructive — the caller must confirm before
 * calling onDelete).
 */
const StrategyActionsMenu: React.FC<StrategyActionsMenuProps> = ({
    onDuplicate,
    onDelete,
    onShare,
    iconColor,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [visible, setVisible] = useState(false);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const close = () => setVisible(false);

    const openMenu = (e: GestureResponderEvent) => {
        // Don't let the parent row's onPress (navigate) fire.
        e.stopPropagation?.();
        setVisible(true);
    };

    return (
        <Menu
            visible={visible}
            onDismiss={close}
            anchor={
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Strategy actions"
                    hitSlop={8}
                    style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
                    onPress={openMenu}
                >
                    <FontAwesomeIcon
                        icon={faEllipsis}
                        size={16}
                        color={iconColor ?? colors.textSecondary}
                    />
                </Pressable>
            }
            contentStyle={styles.menuContent}
        >
            {onShare ? (
                <Menu.Item
                    onPress={() => {
                        close();
                        onShare();
                    }}
                    title="Share Strategy"
                    titleStyle={styles.itemText}
                    leadingIcon={() => (
                        <FontAwesomeIcon icon={faShareNodes} size={15} color={colors.text} />
                    )}
                />
            ) : null}
            <Menu.Item
                onPress={() => {
                    close();
                    onDuplicate();
                }}
                title="Duplicate Strategy"
                titleStyle={styles.itemText}
                leadingIcon={() => (
                    <FontAwesomeIcon icon={faCopy} size={15} color={colors.text} />
                )}
            />
            <Menu.Item
                onPress={() => {
                    close();
                    onDelete();
                }}
                title="Delete Strategy"
                titleStyle={[styles.itemText, styles.itemTextDestructive]}
                leadingIcon={() => (
                    <FontAwesomeIcon icon={faTrashCan} size={15} color={colors.errorBannerText} />
                )}
            />
        </Menu>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                trigger: {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                },
                triggerPressed: {
                    opacity: 0.6,
                },
                menuContent: {
                    backgroundColor: colors.modalBackground,
                    borderRadius: 12,
                },
                itemText: {
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.text,
                },
                itemTextDestructive: {
                    color: colors.errorBannerText,
                },
            }),
        [colors]
    );
}

export default StrategyActionsMenu;
