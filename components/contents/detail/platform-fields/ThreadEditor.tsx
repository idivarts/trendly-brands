/**
 * ThreadEditor — Twitter/X multi-tweet thread composer.
 *
 * Lets the user auto-split the caption into ≤280-char tweets (never mid-word),
 * then tweak the breaks: edit each segment, add a tweet, or remove one. Each
 * segment shows a live character count and flags overflow.
 */
import { splitIntoThread, TWEET_LIMIT } from "@/utils/twitter-thread";
import Colors from "@/shared-uis/constants/Colors";
import { faPlus, faTrashCan, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
    thread: string[];
    /** Source text used by "Auto-split" — the effective caption for this platform. */
    sourceCaption: string;
    onChange: (thread: string[]) => void;
    disabled?: boolean;
}

const ThreadEditor: React.FC<Props> = ({ thread, sourceCaption, onChange, disabled }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const autoSplit = () => {
        const next = splitIntoThread(sourceCaption);
        onChange(next.length ? next : [""]);
    };

    const updateAt = (i: number, value: string) => {
        const next = [...thread];
        next[i] = value;
        onChange(next);
    };
    const removeAt = (i: number) => onChange(thread.filter((_, idx) => idx !== i));
    const addAfter = () => onChange([...thread, ""]);

    const segments = thread.length ? thread : [];

    return (
        <View style={styles.wrap}>
            <View style={styles.head}>
                <Text style={styles.label}>Thread</Text>
                <Pressable
                    onPress={() => !disabled && autoSplit()}
                    style={({ pressed }) => [styles.autoBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Auto-split caption into a thread"
                >
                    <FontAwesomeIcon icon={faWandMagicSparkles} size={11} color={colors.primary} />
                    <Text style={styles.autoBtnText}>Auto-split</Text>
                </Pressable>
            </View>

            {segments.length === 0 ? (
                <Text style={styles.empty}>
                    Posts as a single tweet. Tap Auto-split to break a long caption into a thread
                    without cutting words.
                </Text>
            ) : (
                <>
                <Text style={styles.precedence}>
                    This {segments.length}-tweet thread posts instead of the caption above.
                </Text></>
            )}
            {segments.length > 0 ? (
                segments.map((seg, i) => {
                    const over = seg.length > TWEET_LIMIT;
                    return (
                        <View key={i} style={styles.segment}>
                            <View style={styles.segHead}>
                                <Text style={styles.segNum}>{i + 1}/{segments.length}</Text>
                                <View style={styles.segHeadRight}>
                                    <Text style={[styles.count, over && styles.countOver]}>
                                        {seg.length}/{TWEET_LIMIT}
                                    </Text>
                                    {segments.length > 1 ? (
                                        <Pressable
                                            onPress={() => !disabled && removeAt(i)}
                                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Remove tweet ${i + 1}`}
                                            hitSlop={8}
                                        >
                                            <FontAwesomeIcon icon={faTrashCan} size={11} color={colors.textSecondary} />
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                            <TextInput
                                style={[styles.input, over && styles.inputOver]}
                                value={seg}
                                editable={!disabled}
                                onChangeText={(t) => updateAt(i, t)}
                                multiline
                                textAlignVertical="top"
                                placeholder="Tweet text…"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    );
                })
            ) : null}

            <Pressable
                onPress={() => !disabled && addAfter()}
                style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Add a tweet to the thread"
            >
                <FontAwesomeIcon icon={faPlus} size={11} color={colors.primary} />
                <Text style={styles.addBtnText}>Add tweet</Text>
            </Pressable>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrap: {
            gap: 8,
        },
        head: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        label: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        autoBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.tag,
        },
        autoBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        empty: {
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 16,
        },
        precedence: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.primary,
            lineHeight: 16,
        },
        segment: {
            gap: 6,
            padding: 10,
            borderRadius: 10,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        segHead: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        segNum: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.textSecondary,
        },
        segHeadRight: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        count: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        countOver: {
            color: colors.statusRejectedFg,
            fontWeight: "700",
        },
        iconBtn: {
            width: 24,
            height: 24,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        input: {
            backgroundColor: colors.tag,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 14,
            color: colors.text,
            minHeight: 56,
        },
        inputOver: {
            // Validation-error affordance — the one place a border is allowed.
            borderWidth: 1.5,
            borderColor: colors.statusRejectedFg,
        },
        addBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 9,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        addBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ThreadEditor;
