import DateField from "@/components/modals/DateField";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faClock,
    faEarthAmericas,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fs, lh } from "@/constants/Typography";
import {
    formatDayLabel,
    formatTimeLabel,
    isScheduleInPast,
    schedulePresets,
    timezoneLabel,
    toTimeString,
} from "./schedule-presets";

// ─── ScheduleFields ───────────────────────────────────────────────────────────
// Date + time for a scheduled post, as ONE decision.
//
// Replaces the old "When" (date picker) / "What time?" (fixed chip row) split,
// where the two controls used different interaction models, neither had a
// default, and the unset time silently fell back to 09:00 — which, combined with
// a date defaulting to today, could produce a timestamp in the past.
//
// Presets here carry a full timestamp and are computed relative to now, so one
// tap sets both halves and can never select a past slot.

export interface ScheduleFieldsProps {
    /** The composed date+time this post is scheduled for. */
    value: Date;
    onChange: (next: Date) => void;
}

const ScheduleFields: React.FC<ScheduleFieldsProps> = ({ value, onChange }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    // `now` is captured once per mount: the presets must not shift under the
    // user's finger mid-interaction, and the modal is short-lived.
    const now = useMemo(() => new Date(), []);
    const presets = useMemo(() => schedulePresets(now, 3), [now]);
    const tz = useMemo(() => timezoneLabel(), []);

    const [timeDraft, setTimeDraft] = useState(() => toTimeString(value));
    const [editingTime, setEditingTime] = useState(false);

    const inPast = isScheduleInPast(value, now);
    const activePreset = presets.findIndex((p) => p.date.getTime() === value.getTime());

    // Changing the DATE keeps the chosen time of day — the two halves stay
    // independent once the user starts steering them.
    const applyDate = (next: Date) => {
        const merged = new Date(next);
        merged.setHours(value.getHours(), value.getMinutes(), 0, 0);
        onChange(merged);
    };

    const commitTime = (raw: string) => {
        const m = raw.match(/^(\d{1,2}):(\d{2})$/);
        if (m) {
            const hh = Number(m[1]);
            const mm = Number(m[2]);
            if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
                const merged = new Date(value);
                merged.setHours(hh, mm, 0, 0);
                onChange(merged);
                setEditingTime(false);
                return;
            }
        }
        // Malformed — snap the draft back to the committed value.
        setTimeDraft(toTimeString(value));
        setEditingTime(false);
    };

    return (
        <View>
            {/* ── Date + time, side by side ────────────────────────────────── */}
            <View style={styles.fieldRow}>
                <DateField
                    value={value}
                    onChange={applyDate}
                    title="Date of posting"
                    minimumDate={now}
                    style={styles.field}
                >
                    <View style={styles.fieldInner}>
                        <View style={styles.fieldHead}>
                            <FontAwesomeIcon icon={faCalendarDays} size={11} color={colors.primary} />
                            <Text style={styles.fieldLabel}>Date</Text>
                        </View>
                        <Text style={styles.fieldValue}>{formatDayLabel(value, now)}</Text>
                    </View>
                </DateField>

                <Pressable
                    style={({ pressed }) => [styles.field, pressed && styles.pressed]}
                    onPress={() => {
                        setTimeDraft(toTimeString(value));
                        setEditingTime(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Time: ${formatTimeLabel(value)}. Tap to change.`}
                >
                    <View style={styles.fieldInner}>
                        <View style={styles.fieldHead}>
                            <FontAwesomeIcon icon={faClock} size={11} color={colors.primary} />
                            <Text style={styles.fieldLabel}>Time</Text>
                        </View>
                        {editingTime ? (
                            <TextInput
                                style={styles.timeInput}
                                value={timeDraft}
                                onChangeText={setTimeDraft}
                                onBlur={() => commitTime(timeDraft)}
                                onSubmitEditing={() => commitTime(timeDraft)}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSecondary}
                                maxLength={5}
                                keyboardType="numbers-and-punctuation"
                                autoFocus
                                selectTextOnFocus
                            />
                        ) : (
                            <Text style={styles.fieldValue}>{formatTimeLabel(value)}</Text>
                        )}
                    </View>
                </Pressable>
            </View>

            {/* ── Relative presets — one tap sets date AND time ─────────────── */}
            <View style={styles.presetRow}>
                {presets.map((p, i) => {
                    const on = i === activePreset;
                    return (
                        <Pressable
                            key={p.date.toISOString()}
                            style={({ pressed }) => [
                                styles.preset,
                                on && styles.presetOn,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => onChange(p.date)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            accessibilityLabel={`Schedule for ${p.label}`}
                        >
                            <Text style={[styles.presetText, on && styles.presetTextOn]}>
                                {p.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {inPast ? (
                <View style={styles.warnRow}>
                    <FontAwesomeIcon
                        icon={faTriangleExclamation}
                        size={11}
                        color={colors.errorBannerText}
                    />
                    <Text style={styles.warnText}>
                        That time has already passed. Pick a later one, or go back and post now.
                    </Text>
                </View>
            ) : (
                <View style={styles.tzRow}>
                    <FontAwesomeIcon icon={faEarthAmericas} size={10} color={colors.textSecondary} />
                    <Text style={styles.tzText}>Your time — {tz}</Text>
                </View>
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        fieldRow: {
            flexDirection: "row",
            gap: 8,
        },
        field: {
            flex: 1,
            borderRadius: 11,
            backgroundColor: colors.aliceBlue,
        },
        fieldInner: {
            paddingHorizontal: 12,
            paddingVertical: 10,
        },
        fieldHead: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginBottom: 2,
        },
        fieldLabel: {
            fontSize: fs(11),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        fieldValue: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.text,
        },
        timeInput: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.text,
            padding: 0,
            margin: 0,
        },
        presetRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 7,
            marginTop: 9,
        },
        preset: {
            paddingHorizontal: 11,
            paddingVertical: 11,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        presetOn: {
            backgroundColor: colors.primary,
        },
        presetText: {
            fontSize: fs(12),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        presetTextOn: {
            color: colors.onPrimary,
        },
        tzRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 10,
        },
        tzText: {
            fontSize: fs(11),
            color: colors.textSecondary,
        },
        warnRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 6,
            marginTop: 10,
        },
        warnText: {
            flex: 1,
            fontSize: fs(11),
            fontWeight: "600",
            color: colors.errorBannerText,
            lineHeight: lh(16),
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ScheduleFields;
