/**
 * SettingsStrip — the compact row of current settings under the prompt.
 *
 * Everything with a sensible default lives here, showing its VALUE rather than
 * its name ("4 slides", not "Slides: 4"), so the strip reads as a sentence
 * about what is about to be made and costs almost no vertical space. Anything
 * the user must supply is not a setting — it goes in the tray above, where it
 * has room.
 *
 * The strip scrolls horizontally rather than wrapping: a wrapping strip changes
 * the composer's height as you switch approach, which moves the prompt box the
 * user is typing in.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SETTINGS, SettingKey, settingLabel } from "./approach-spec";

interface Props {
    keys: SettingKey[];
    values: Partial<Record<SettingKey, string>>;
    onOpen: (key: SettingKey) => void;
    disabled?: boolean;
}

const SettingsStrip: React.FC<Props> = ({ keys, values, onOpen, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    if (!keys.length) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            keyboardShouldPersistTaps="handled"
        >
            {keys.map((key) => {
                const value = values[key];
                if (!value) return null;
                return (
                    <Pressable
                        key={key}
                        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                        onPress={() => onOpen(key)}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityLabel={`${SETTINGS[key].label}: ${value}`}
                    >
                        <Text style={styles.chipText}>{settingLabel(key, value)}</Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingRight: 8,
                },
                chip: {
                    paddingVertical: 6,
                    paddingHorizontal: 11,
                    borderRadius: 8,
                    backgroundColor: colors.tag,
                },
                chipText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "500",
                    color: colors.text,
                },
                pressed: {
                    opacity: 0.7,
                },
            }),
        [colors]
    );

export default SettingsStrip;
