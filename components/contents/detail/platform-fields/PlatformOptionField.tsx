/**
 * PlatformOptionField — renders a single registry-driven platform option
 * (text / textarea / select / toggle / tags). The Twitter "thread" type is
 * handled by its own {@link ThreadEditor} and is NOT routed here.
 *
 * Pure presentation: it reads its value out of `platformOptions` by the field's
 * `key` and reports edits via `onChange`.
 */
import { IPlatformOptions } from "@/shared-libs/firestore/trendly-pro/models/contents";
import { PlatformFieldDef } from "@/shared-libs/firestore/trendly-pro/constants/platform-fields";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    field: PlatformFieldDef;
    options: IPlatformOptions;
    onChange: (patch: Partial<IPlatformOptions>) => void;
    disabled?: boolean;
}

const PlatformOptionField: React.FC<Props> = ({ field, options, onChange, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const raw = options[field.key];

    const set = (value: unknown) => onChange({ [field.key]: value } as Partial<IPlatformOptions>);

    const renderControl = () => {
        switch (field.type) {
            case "toggle": {
                const on = !!raw;
                return (
                    <Pressable
                        style={({ pressed }) => [styles.toggle, on && styles.toggleOn, pressed && styles.pressed]}
                        onPress={() => !disabled && set(!on)}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={field.label}
                    >
                        <View style={[styles.knob, on && styles.knobOn]} />
                    </Pressable>
                );
            }
            case "select":
                return (
                    <View style={styles.chipRow}>
                        {(field.options ?? []).map((opt) => {
                            const on = raw === opt.value;
                            return (
                                <Pressable
                                    key={opt.value}
                                    onPress={() => !disabled && set(opt.value)}
                                    style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
                                >
                                    {on ? (
                                        <FontAwesomeIcon icon={faCheck} size={10} color={colors.onPrimary} />
                                    ) : null}
                                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                );
            case "tags": {
                const arr = Array.isArray(raw) ? (raw as string[]) : [];
                return (
                    <TextInput
                        style={styles.input}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        value={arr.join(", ")}
                        editable={!disabled}
                        onChangeText={(t) =>
                            set(
                                t
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                            )
                        }
                    />
                );
            }
            case "textarea":
                return (
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        value={typeof raw === "string" ? raw : ""}
                        editable={!disabled}
                        onChangeText={set}
                        multiline
                        textAlignVertical="top"
                        maxLength={field.maxLen}
                    />
                );
            default: // text
                return (
                    <TextInput
                        style={styles.input}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        value={typeof raw === "string" ? raw : ""}
                        editable={!disabled}
                        onChangeText={(t) => set(field.key === "redditSubreddit" ? t.replace(/^\/?r\//i, "").trim() : t)}
                        autoCapitalize={field.key === "redditSubreddit" ? "none" : "sentences"}
                        maxLength={field.maxLen}
                    />
                );
        }
    };

    const isToggle = field.type === "toggle";
    return (
        <View style={styles.wrap}>
            <View style={isToggle ? styles.toggleRow : undefined}>
                <View style={isToggle ? styles.toggleLabelWrap : undefined}>
                    <Text style={styles.label}>
                        {field.label}
                        {field.required ? <Text style={styles.req}> *</Text> : null}
                    </Text>
                    {field.hint && isToggle ? <Text style={styles.hint}>{field.hint}</Text> : null}
                </View>
                {isToggle ? renderControl() : null}
            </View>
            {!isToggle ? renderControl() : null}
            {field.hint && !isToggle ? <Text style={styles.hint}>{field.hint}</Text> : null}
            {field.settable === false ? (
                <View style={styles.manualRow}>
                    <FontAwesomeIcon icon={faTriangleExclamation} size={10} color={colors.statusReviewFg} />
                    <Text style={styles.manualText}>Not set automatically — you'll add this manually on the platform.</Text>
                </View>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            gap: 6,
        },
        label: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        req: {
            color: colors.statusRejectedFg,
        },
        hint: {
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 15,
        },
        input: {
            backgroundColor: colors.card,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        textarea: {
            minHeight: 72,
        },
        chipRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        chipOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        chipText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        chipTextOn: {
            color: colors.onPrimary,
        },
        toggleRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        toggleLabelWrap: {
            flex: 1,
            gap: 3,
        },
        toggle: {
            width: 44,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.tag,
            padding: 3,
            justifyContent: "center",
        },
        toggleOn: {
            backgroundColor: colors.primary,
        },
        knob: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.card,
            alignSelf: "flex-start",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
            shadowOpacity: 0.2,
            elevation: 2,
        },
        knobOn: {
            alignSelf: "flex-end",
        },
        manualRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        manualText: {
            fontSize: 10,
            color: colors.textSecondary,
            flex: 1,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PlatformOptionField;
