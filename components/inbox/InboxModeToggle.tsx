import { faComments, faImages } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";

import { InboxMode } from "./types";

interface Props {
    mode: InboxMode;
    onChange: (mode: InboxMode) => void;
}

const TABS: { key: InboxMode; label: string; icon: typeof faComments }[] = [
    { key: "messages", label: "Messages", icon: faComments },
    { key: "media", label: "Media", icon: faImages },
];

/**
 * Messages/Media switcher rendered in the Inbox page header. Shows icon + label
 * on desktop (xl); collapses to icon-only on mobile (!xl) to fit the header row.
 */
const InboxModeToggle: React.FC<Props> = ({ mode, onChange }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    // const { xl } = useBreakpoints();
    const styles = useStyles(colors);

    return (
        <View style={styles.group}>
            {TABS.map((t) => {
                const active = mode === t.key;
                return (
                    <Pressable
                        key={t.key}
                        onPress={() => onChange(t.key)}
                        style={[
                            styles.tab,
                            active && styles.tabActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={t.label}
                        accessibilityState={{ selected: active }}
                    >
                        <FontAwesomeIcon
                            icon={t.icon}
                            size={15}
                            color={active ? colors.onPrimary : colors.textSecondary}
                        />
                        <Text style={[styles.label, active && styles.labelActive]}>
                            {t.label}
                        </Text>
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
                group: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                tab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                },
                tabCompact: {
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                tabActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                label: {
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                labelActive: {
                    color: colors.onPrimary,
                },
            }),
        [colors]
    );
}

export default InboxModeToggle;
