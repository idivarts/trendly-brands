import Colors from "@/shared-uis/constants/Colors";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Menu } from "react-native-paper";

/**
 * Triple-dot menu in the Contents header. Opens the gallery-only "library"
 * pages for content that's left the authoring funnel.
 */
const ContentsOverflowMenu: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const router = useRouter();
    const [visible, setVisible] = useState(false);
    const styles = useStyles(colors);

    const go = (path: string) => {
        setVisible(false);
        router.push(path as any);
    };

    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchor={
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="More content views"
                    style={styles.btn}
                    onPress={() => setVisible(true)}
                >
                    <FontAwesomeIcon icon={faEllipsisVertical} size={18} color={colors.text} />
                </Pressable>
            }
        >
            <Menu.Item onPress={() => go("/contents/scheduled")} title="Scheduled content" />
            <Menu.Item onPress={() => go("/contents/posted")} title="Posted content" />
            <Menu.Item onPress={() => go("/contents/archived")} title="Archived / Deleted" />
        </Menu>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                btn: {
                    width: 38,
                    height: 38,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                },
            }),
        [colors]
    );
}

export default ContentsOverflowMenu;
