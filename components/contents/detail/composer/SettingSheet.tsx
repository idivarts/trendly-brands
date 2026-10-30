/**
 * SettingSheet — the one-setting picker opened from the settings strip.
 *
 * Deliberately a sheet with one question in it rather than a settings panel
 * with all of them. The strip already shows every current value, so the only
 * reason to open anything is to change one — and a panel that shows six
 * controls to change one is six decisions presented where the user had made
 * exactly one.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { withAlpha } from "@/utils/color";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SETTINGS, SettingKey, SettingOption } from "./approach-spec";

interface Props {
    settingKey: SettingKey | null;
    value?: string;
    contentType: ContentType;
    /**
     * Replaces the table's options for one setting.
     *
     * Used for the AI-video length, which is the chosen MODEL's min/max rather
     * than a list of ours: a model capped at 8s refuses a 30s request, so
     * offering 30 would be offering a value that is always rejected.
     */
    overrideOptions?: SettingOption[];
    onPick: (value: string) => void;
    onClose: () => void;
}

const SettingSheet: React.FC<Props> = ({
    settingKey,
    value,
    contentType,
    overrideOptions,
    onPick,
    onClose,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const spec = settingKey ? SETTINGS[settingKey] : null;

    return (
        <Modal
            visible={!!spec}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close">
                {/* Stops a press inside the sheet from closing it. */}
                <Pressable style={styles.sheet} onPress={() => {}}>
                    {spec ? (
                        <>
                            <Text style={styles.title}>{spec.label}</Text>
                            {spec.sub ? <Text style={styles.sub}>{spec.sub}</Text> : null}
                            <ScrollView
                                style={styles.list}
                                showsVerticalScrollIndicator={false}
                            >
                                {(overrideOptions ?? spec.options(contentType)).map((o) => {
                                    const active = o.value === value;
                                    return (
                                        <Pressable
                                            key={o.value}
                                            style={({ pressed }) => [
                                                styles.option,
                                                active && styles.optionActive,
                                                pressed && styles.pressed,
                                            ]}
                                            onPress={() => onPick(o.value)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: active }}
                                            accessibilityLabel={o.name}
                                        >
                                            <View style={styles.optionBody}>
                                                <Text style={styles.optionName}>{o.name}</Text>
                                                {o.detail ? (
                                                    <Text style={styles.optionDetail}>{o.detail}</Text>
                                                ) : null}
                                            </View>
                                            {active ? (
                                                <FontAwesomeIcon
                                                    icon={faCheck}
                                                    size={13}
                                                    color={colors.primary}
                                                />
                                            ) : null}
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </>
                    ) : null}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                scrim: {
                    flex: 1,
                    backgroundColor: colors.backdropStrong,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 380,
                    maxHeight: "80%",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    padding: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.18,
                    elevation: 12,
                },
                title: {
                    fontSize: fs(15),
                    lineHeight: lh(20),
                    fontWeight: "700",
                    color: colors.text,
                },
                sub: {
                    fontSize: fs(12),
                    lineHeight: lh(17),
                    color: colors.textSecondary,
                    marginTop: 2,
                },
                list: {
                    marginTop: 12,
                },
                option: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    marginBottom: 7,
                },
                optionActive: {
                    backgroundColor: withAlpha(colors.primary, 0.12),
                },
                optionBody: {
                    flex: 1,
                },
                optionName: {
                    fontSize: fs(13),
                    lineHeight: lh(18),
                    fontWeight: "600",
                    color: colors.text,
                },
                optionDetail: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                    marginTop: 1,
                },
                pressed: {
                    opacity: 0.75,
                },
            }),
        [colors]
    );

export default SettingSheet;
