import Colors from "@/shared-uis/constants/Colors";
import { faBorderAll, faTableColumns } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export type ContentView = "gallery" | "board";

interface ContentViewSwitcherProps {
    value: ContentView;
    onChange: (view: ContentView) => void;
}

/** Segmented Gallery / Board toggle. Rendered desktop-only by the host page. */
const ContentViewSwitcher: React.FC<ContentViewSwitcherProps> = ({ value, onChange }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const segments: { key: ContentView; icon: typeof faBorderAll }[] = [
        { key: "gallery", icon: faBorderAll },
        { key: "board", icon: faTableColumns },
    ];

    return (
        <View style={styles.container}>
            {segments.map((seg) => {
                const active = value === seg.key;
                return (
                    <Pressable
                        key={seg.key}
                        accessibilityRole="button"
                        accessibilityLabel={seg.key === "gallery" ? "Gallery view" : "Board view"}
                        accessibilityState={{ selected: active }}
                        style={[styles.segment, active && styles.segmentActive]}
                        onPress={() => onChange(seg.key)}
                    >
                        <FontAwesomeIcon
                            icon={seg.icon}
                            size={15}
                            color={active ? colors.onPrimary : colors.textSecondary}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flexDirection: "row",
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    padding: 3,
                    gap: 3,
                },
                segment: {
                    width: 38,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                },
                segmentActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
            }),
        [colors]
    );
}

export default ContentViewSwitcher;
