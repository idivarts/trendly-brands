/**
 * MOCK ONLY — delete this file when removing the mock layer.
 *
 * A small floating control that cycles the Inbox through its three demo
 * states. Visible only while `SHOW_DEV_STATE_SWITCHER` is true.
 */
import { faChevronUp, faFlask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useMockScenario } from "./mock-scenario-context";
import { INBOX_SCENARIOS } from "./scenario";

/** Flip to false to hide the switcher without removing the mock. */
export const SHOW_DEV_STATE_SWITCHER = false;

const DevStateSwitcher: React.FC = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const { scenario, setScenario } = useMockScenario();
    const [open, setOpen] = useState(false);

    if (!SHOW_DEV_STATE_SWITCHER) return null;

    return (
        <View style={styles.wrap} pointerEvents="box-none">
            {open ? (
                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>DEMO STATE</Text>
                    {INBOX_SCENARIOS.map((s) => {
                        const active = s.key === scenario;
                        return (
                            <Pressable
                                key={s.key}
                                onPress={() => setScenario(s.key)}
                                style={[
                                    styles.option,
                                    active && { backgroundColor: colors.primary },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        { color: active ? colors.onPrimary : colors.text },
                                    ]}
                                >
                                    {s.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.optionDesc,
                                        { color: active ? colors.onPrimary : colors.textSecondary },
                                    ]}
                                >
                                    {s.description}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}

            <Pressable
                onPress={() => setOpen((v) => !v)}
                style={[styles.fab, { backgroundColor: colors.primary }]}
            >
                <FontAwesomeIcon
                    icon={open ? faChevronUp : faFlask}
                    size={16}
                    color={colors.onPrimary}
                />
                <Text style={[styles.fabText, { color: colors.onPrimary }]}>
                    {INBOX_SCENARIOS.find((s) => s.key === scenario)?.label ?? "Demo"}
                </Text>
            </Pressable>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    position: "absolute",
                    right: 16,
                    bottom: 90,
                    alignItems: "flex-end",
                    gap: 10,
                    zIndex: 999,
                },
                panel: {
                    width: 240,
                    borderRadius: 16,
                    padding: 8,
                    backgroundColor: colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 16,
                    shadowOpacity: 0.18,
                    elevation: 8,
                },
                panelTitle: {
                    fontSize: 10,
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: colors.textSecondary,
                    paddingHorizontal: 10,
                    paddingTop: 8,
                    paddingBottom: 6,
                },
                option: {
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                },
                optionLabel: {
                    fontSize: 14,
                    fontWeight: "700",
                },
                optionDesc: {
                    fontSize: 12,
                    marginTop: 2,
                },
                fab: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 16,
                    height: 44,
                    borderRadius: 22,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.25,
                    elevation: 6,
                },
                fabText: {
                    fontSize: 14,
                    fontWeight: "700",
                },
            }),
        [colors]
    );
}

export default DevStateSwitcher;
