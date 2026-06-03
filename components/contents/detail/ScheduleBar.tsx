import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import { POPULAR_POSTING_TIMES, ScheduleMode, SocialDestination } from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBolt,
    faCalendarDays,
    faCheck,
    faClock,
    faPaperPlane,
    faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface ScheduleBarProps {
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    onDestinationsChange: (next: SocialDestination[]) => void;
    scheduleMode: ScheduleMode;
    onScheduleModeChange: (m: ScheduleMode) => void;
    formattedDate: string;
    onPressDate: () => void;
    timeOfPosting: string;
    onTimeChange: (t: string) => void;
    onPublish: () => void;
    publishing: boolean;
    /** When true, renders without its own card chrome (sits inside a parent card). */
    embedded?: boolean;
    /** When true, both blocks stay fully expanded with no summary/Edit toggles
     *  (used inside the publish modal, where editing is the whole point). */
    alwaysEditing?: boolean;
}

// Only these platforms are publishable from Trendly today.
const PUBLISHABLE = new Set(["instagram", "facebook"]);

const ScheduleBar: React.FC<ScheduleBarProps> = ({
    socialAccounts,
    destinations,
    onDestinationsChange,
    scheduleMode,
    onScheduleModeChange,
    formattedDate,
    onPressDate,
    timeOfPosting,
    onTimeChange,
    onPublish,
    publishing,
    embedded = false,
    alwaysEditing = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const accounts = useMemo(
        () => socialAccounts.filter((a) => PUBLISHABLE.has(a.platform)),
        [socialAccounts]
    );

    const isSelected = (id: string) => destinations.some((d) => d.socialAccountId === id);
    const toggle = (a: ISocialAccount) => {
        if (isSelected(a.id)) {
            onDestinationsChange(destinations.filter((d) => d.socialAccountId !== a.id));
        } else {
            onDestinationsChange([
                ...destinations,
                {
                    socialAccountId: a.id,
                    platform: a.platform as SocialDestination["platform"],
                    username: a.username,
                },
            ]);
        }
    };

    const isCustomTime =
        !!timeOfPosting && !POPULAR_POSTING_TIMES.some((t) => t.value === timeOfPosting);
    const [showCustom, setShowCustom] = useState(isCustomTime);

    // ── Collapsed-by-default editing: show a compact summary, reveal the pickers
    //    only when the user taps "Edit". Destinations stay open until at least
    //    one account is chosen (you can't publish without one).
    const [editDest, setEditDest] = useState(false);
    const [editWhen, setEditWhen] = useState(false);
    const showDestPicker = alwaysEditing || editDest || destinations.length === 0;
    const showWhenControls = alwaysEditing || editWhen;

    const timeLabel = useMemo(() => {
        if (!timeOfPosting) return "default time";
        const popular = POPULAR_POSTING_TIMES.find((t) => t.value === timeOfPosting);
        return popular ? popular.label : timeOfPosting;
    }, [timeOfPosting]);

    const whenSummary =
        scheduleMode === "now" ? "Publish now" : `${formattedDate} · ${timeLabel}`;

    const selected = useMemo(
        () =>
            destinations
                .map((d) => accounts.find((a) => a.id === d.socialAccountId) ?? null)
                .filter(Boolean) as ISocialAccount[],
        [destinations, accounts]
    );

    const canPublish = destinations.length > 0 && !publishing;
    const publishLabel = publishing
        ? scheduleMode === "now"
            ? "Publishing…"
            : "Scheduling…"
        : scheduleMode === "now"
            ? "Publish now"
            : "Schedule post";

    const renderAccountChip = (a: ISocialAccount, on: boolean, onPress?: () => void) => {
        const dot =
            a.platform === "instagram" ? colors.socialInstagram : colors.socialFacebook;
        return (
            <Pressable
                key={a.id}
                style={({ pressed }) => [
                    styles.accountChip,
                    on && styles.accountChipOn,
                    !onPress && styles.accountChipStatic,
                    pressed && onPress && styles.pressed,
                ]}
                onPress={onPress}
                disabled={!onPress}
            >
                {a.profileImageURL ? (
                    <Image source={{ uri: a.profileImageURL }} style={styles.accountAvatar} />
                ) : (
                    <View style={[styles.accountAvatar, styles.accountAvatarFallback]}>
                        <Text style={styles.accountInitial}>
                            {(a.username || "?").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={[styles.platformDot, { backgroundColor: dot }]} />
                <Text
                    style={[styles.accountName, on && styles.accountNameOn]}
                    numberOfLines={1}
                >
                    {a.username}
                </Text>
                {on && onPress ? (
                    <FontAwesomeIcon icon={faCheck} size={11} color={colors.onPrimary} />
                ) : null}
            </Pressable>
        );
    };

    return (
        <View style={embedded ? styles.embedded : styles.card}>
            {/* ── Destinations ─────────────────────────────────────────── */}
            <View style={styles.blockHead}>
                <Text style={styles.blockLabel}>Send to</Text>
                {!alwaysEditing && accounts.length > 0 && destinations.length > 0 ? (
                    <Pressable
                        style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                        onPress={() => setEditDest((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={editDest ? "Done editing accounts" : "Edit accounts"}
                    >
                        <FontAwesomeIcon
                            icon={faPen}
                            size={10}
                            color={colors.primary}
                        />
                        <Text style={styles.editText}>{editDest ? "Done" : "Edit"}</Text>
                    </Pressable>
                ) : null}
            </View>

            {accounts.length === 0 ? (
                <Text style={styles.emptyAccounts}>
                    No connected accounts yet. Connect Instagram or Facebook to publish.
                </Text>
            ) : showDestPicker ? (
                <View style={styles.accountRow}>
                    {accounts.map((a) => renderAccountChip(a, isSelected(a.id), () => toggle(a)))}
                </View>
            ) : (
                <View style={styles.accountRow}>
                    {selected.map((a) => renderAccountChip(a, true))}
                </View>
            )}

            {/* ── When ─────────────────────────────────────────────────── */}
            <View style={styles.softDivider} />
            <View style={styles.blockHead}>
                <Text style={styles.blockLabel}>When</Text>
                {!alwaysEditing ? (
                    <Pressable
                        style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                        onPress={() => setEditWhen((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={editWhen ? "Done editing schedule" : "Edit schedule"}
                    >
                        <FontAwesomeIcon icon={faPen} size={10} color={colors.primary} />
                        <Text style={styles.editText}>{editWhen ? "Done" : "Edit"}</Text>
                    </Pressable>
                ) : null}
            </View>

            {!showWhenControls ? (
                <View style={styles.whenSummaryRow}>
                    <FontAwesomeIcon
                        icon={scheduleMode === "now" ? faBolt : faCalendarDays}
                        size={12}
                        color={colors.primary}
                    />
                    <Text style={styles.whenSummaryText}>{whenSummary}</Text>
                </View>
            ) : (
                <>
                    <View style={styles.modeRow}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.modeBtn,
                                scheduleMode === "now" && styles.modeBtnOn,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => onScheduleModeChange("now")}
                        >
                            <FontAwesomeIcon
                                icon={faBolt}
                                size={12}
                                color={scheduleMode === "now" ? colors.onPrimary : colors.textSecondary}
                            />
                            <Text style={[styles.modeText, scheduleMode === "now" && styles.modeTextOn]}>
                                Publish now
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.modeBtn,
                                scheduleMode === "scheduled" && styles.modeBtnOn,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => onScheduleModeChange("scheduled")}
                        >
                            <FontAwesomeIcon
                                icon={faClock}
                                size={12}
                                color={scheduleMode === "scheduled" ? colors.onPrimary : colors.textSecondary}
                            />
                            <Text style={[styles.modeText, scheduleMode === "scheduled" && styles.modeTextOn]}>
                                Schedule
                            </Text>
                        </Pressable>
                    </View>

                    {scheduleMode === "scheduled" ? (
                        <View style={styles.scheduleArea}>
                            <Pressable style={styles.dateBtn} onPress={onPressDate}>
                                <FontAwesomeIcon icon={faCalendarDays} size={12} color={colors.primary} />
                                <Text style={styles.dateBtnText}>{formattedDate}</Text>
                            </Pressable>

                            <View style={styles.timeRow}>
                                {POPULAR_POSTING_TIMES.map((t) => {
                                    const on = timeOfPosting === t.value && !showCustom;
                                    return (
                                        <Pressable
                                            key={t.value}
                                            style={({ pressed }) => [
                                                styles.timeChip,
                                                on && styles.timeChipOn,
                                                pressed && styles.pressed,
                                            ]}
                                            onPress={() => {
                                                setShowCustom(false);
                                                onTimeChange(t.value);
                                            }}
                                        >
                                            <Text style={[styles.timeChipText, on && styles.timeChipTextOn]}>
                                                {t.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.timeChip,
                                        showCustom && styles.timeChipOn,
                                        pressed && styles.pressed,
                                    ]}
                                    onPress={() => {
                                        setShowCustom(true);
                                        onTimeChange("");
                                    }}
                                >
                                    <Text style={[styles.timeChipText, showCustom && styles.timeChipTextOn]}>
                                        Custom
                                    </Text>
                                </Pressable>
                            </View>

                            {showCustom ? (
                                <TextInput
                                    style={styles.customInput}
                                    placeholder="HH:MM (e.g. 08:30)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={timeOfPosting}
                                    onChangeText={onTimeChange}
                                    maxLength={5}
                                    keyboardType="numbers-and-punctuation"
                                />
                            ) : null}
                        </View>
                    ) : null}
                </>
            )}

            {/* ── Primary action ───────────────────────────────────────── */}
            <Pressable
                style={({ pressed }) => [
                    styles.publishBtn,
                    !canPublish && styles.publishBtnDisabled,
                    pressed && styles.pressed,
                ]}
                onPress={onPublish}
                disabled={!canPublish}
            >
                {publishing ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <FontAwesomeIcon
                        icon={scheduleMode === "now" ? faPaperPlane : faClock}
                        size={14}
                        color={colors.onPrimary}
                    />
                )}
                <Text style={styles.publishBtnText}>{publishLabel}</Text>
            </Pressable>
            {destinations.length === 0 ? (
                <Text style={styles.hint}>Select at least one account to continue.</Text>
            ) : null}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        embedded: {
            // No chrome — the parent card provides background, padding and shadow.
        },
        blockHead: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        blockLabel: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        editBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 7,
            backgroundColor: colors.aliceBlue,
        },
        editText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        softDivider: {
            height: 16,
        },
        emptyAccounts: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        accountRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        accountChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingLeft: 6,
            paddingRight: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: colors.tag,
        },
        accountChipOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        accountChipStatic: {
            // Summary chips read as a value, not a toggle — keep them quiet.
            backgroundColor: colors.aliceBlue,
            shadowOpacity: 0,
            elevation: 0,
        },
        accountAvatar: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.card,
        },
        accountAvatarFallback: {
            alignItems: "center",
            justifyContent: "center",
        },
        accountInitial: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.primary,
        },
        platformDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: -2,
        },
        accountName: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
            maxWidth: 120,
        },
        accountNameOn: {
            color: colors.onPrimary,
            fontWeight: "700",
        },
        whenSummaryRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 2,
        },
        whenSummaryText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        modeRow: {
            flexDirection: "row",
            gap: 8,
        },
        modeBtn: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        modeBtnOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        modeText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        modeTextOn: {
            color: colors.onPrimary,
            fontWeight: "700",
        },
        scheduleArea: {
            marginTop: 12,
            gap: 12,
        },
        dateBtn: {
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 7,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            backgroundColor: colors.aliceBlue,
        },
        dateBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.primary,
        },
        timeRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        timeChip: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            backgroundColor: colors.tag,
        },
        timeChipOn: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        timeChipText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        timeChipTextOn: {
            color: colors.onPrimary,
        },
        customInput: {
            backgroundColor: colors.tag,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        publishBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
            paddingVertical: 13,
            borderRadius: 11,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        publishBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        publishBtnText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        hint: {
            fontSize: 11,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 8,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default ScheduleBar;
