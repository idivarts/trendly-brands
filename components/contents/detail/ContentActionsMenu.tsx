import Colors from "@/shared-uis/constants/Colors";
import {
    faCircleInfo,
    faClone,
    faEllipsisVertical,
    faShareNodes,
    faTrashCan,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Menu } from "react-native-paper";
import { fs } from "@/constants/Typography";

interface ContentActionsMenuProps {
    /** Opens the content-details (title / idea / status) modal. */
    onDetails: () => void;
    /** Opens the public share modal. Omit to hide the Share item. */
    onShare?: () => void;
    /** Duplicates this content into a fresh draft copy. Omit to hide. */
    onDuplicate?: () => void;
    /** Destructive — the caller must confirm before deleting. Omit to hide. */
    onDelete?: () => void;
    /**
     * Opens the new Design Studio at its own route.
     *
     * ⚠️ It sits BESIDE the existing design surface rather than replacing it.
     * The studio is being built phase by phase and does not yet do everything
     * the old path does — swapping the entry point now would take working
     * capability away. The old path is removed in the cutover phase, once the
     * studio can do all of it.
     */
    onOpenStudio?: () => void;
}

/**
 * Triple-dot overflow menu for the Content detail page header. Groups the
 * secondary actions (Content details, Share) alongside the destructive Delete,
 * keeping the header itself down to the primary Publish + Save buttons. This
 * matters most on !xl, where four inline buttons would crowd the title.
 *
 * Mirrors StrategyActionsMenu; the trigger adopts the header's tag-filled icon
 * button styling so it sits flush with the other header actions.
 */
const ContentActionsMenu: React.FC<ContentActionsMenuProps> = ({
    onDetails,
    onShare,
    onDuplicate,
    onDelete,
    onOpenStudio,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const [visible, setVisible] = useState(false);
    const styles = useStyles(colors);

    const close = () => setVisible(false);
    const run = (fn: () => void) => () => {
        close();
        fn();
    };

    return (
        <Menu
            visible={visible}
            onDismiss={close}
            anchor={
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="More content actions"
                    hitSlop={8}
                    style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
                    onPress={() => setVisible(true)}
                >
                    <FontAwesomeIcon
                        icon={faEllipsisVertical}
                        size={18}
                        color={colors.textSecondary}
                    />
                </Pressable>
            }
            contentStyle={styles.menuContent}
        >
            <Menu.Item
                onPress={run(onDetails)}
                title="Content details"
                titleStyle={styles.itemText}
                leadingIcon={() => (
                    <FontAwesomeIcon icon={faCircleInfo} size={15} color={colors.text} />
                )}
            />
            {onShare ? (
                <Menu.Item
                    onPress={run(onShare)}
                    title="Share content"
                    titleStyle={styles.itemText}
                    leadingIcon={() => (
                        <FontAwesomeIcon icon={faShareNodes} size={15} color={colors.text} />
                    )}
                />
            ) : null}
            {onOpenStudio ? (
                <Menu.Item
                    onPress={run(onOpenStudio)}
                    title="Open design studio"
                    titleStyle={styles.itemText}
                    leadingIcon={() => (
                        <FontAwesomeIcon
                            icon={faWandMagicSparkles}
                            size={15}
                            color={colors.primary}
                        />
                    )}
                />
            ) : null}
            {onDuplicate ? (
                <Menu.Item
                    onPress={run(onDuplicate)}
                    title="Duplicate content"
                    titleStyle={styles.itemText}
                    leadingIcon={() => (
                        <FontAwesomeIcon icon={faClone} size={15} color={colors.text} />
                    )}
                />
            ) : null}
            {onDelete ? (
                <Menu.Item
                    onPress={run(onDelete)}
                    title="Delete content"
                    titleStyle={[styles.itemText, styles.itemTextDestructive]}
                    leadingIcon={() => (
                        <FontAwesomeIcon icon={faTrashCan} size={15} color={colors.errorBannerText} />
                    )}
                />
            ) : null}
        </Menu>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                trigger: {
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                triggerPressed: {
                    opacity: 0.75,
                },
                menuContent: {
                    backgroundColor: colors.modalBackground,
                    borderRadius: 12,
                },
                itemText: {
                    fontSize: fs(14),
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

export default ContentActionsMenu;
