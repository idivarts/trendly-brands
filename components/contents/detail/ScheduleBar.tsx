import DateField from "@/components/modals/DateField";
import { ISocialAccount, socialAccountLabel } from "@/contexts/brand-social-context.provider";
import { POPULAR_POSTING_TIMES, ScheduleMode, SocialDestination } from "@/components/contents/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faBolt,
    faCalendarDays,
    faCheck,
    faClock,
    faPenToSquare,
    faPlus,
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
import PublishNowConfirmModal from "./PublishNowConfirmModal";

interface ScheduleBarProps {
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    onDestinationsChange: (next: SocialDestination[]) => void;
    formattedDate: string;
    /** The currently-selected posting date (drives the inline picker). */
    dateValue: Date;
    onDateChange: (next: Date) => void;
    timeOfPosting: string;
    onTimeChange: (t: string) => void;
    /** Fire the publish/schedule request for the given mode. */
    onPublish: (mode: ScheduleMode) => void;
    publishing: boolean;
    /** When true, renders without its own card chrome (sits inside a parent card). */
    embedded?: boolean;
}

// Only these platforms are publishable from Trendly today.
const PUBLISHABLE = new Set(["instagram", "facebook", "linkedin"]);

// Brand colour for a platform's dot indicator.
const platformDotColor = (platform: string, colors: ReturnType<typeof Colors>) => {
    switch (platform) {
        case "instagram":
            return colors.socialInstagram;
        case "linkedin":
            return colors.socialLinkedin;
        default:
            return colors.socialFacebook;
    }
};

const ScheduleBar: React.FC<ScheduleBarProps> = ({
    socialAccounts,
    destinations,
    onDestinationsChange,
    formattedDate,
    dateValue,
    onDateChange,
    timeOfPosting,
    onTimeChange,
    onPublish,
    publishing,
    embedded = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

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
                    username: socialAccountLabel(a),
                },
            ]);
        }
    };

    const isCustomTime =
        !!timeOfPosting && !POPULAR_POSTING_TIMES.some((t) => t.value === timeOfPosting);
    const [showCustom, setShowCustom] = useState(isCustomTime);
    const [confirmNow, setConfirmNow] = useState(false);

    const count = destinations.length;
    const canPublish = count > 0 && !publishing;

    const renderAccountChip = (a: ISocialAccount, on: boolean) => {
        const dot = platformDotColor(a.platform, colors);
        const label = socialAccountLabel(a);
        return (
            <Pressable
                key={a.id}
                style={({ pressed }) => [
                    styles.accountChip,
                    on && styles.accountChipOn,
                    pressed && styles.pressed,
                ]}
                onPress={() => toggle(a)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${on ? "Selected" : "Not selected"}: ${label}`}
            >
                {a.profileImageURL ? (
                    <Image source={{ uri: a.profileImageURL }} style={styles.accountAvatar} />
                ) : (
                    <View style={[styles.accountAvatar, styles.accountAvatarFallback]}>
                        <Text style={styles.accountInitial}>
                            {(label || "?").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={[styles.platformDot, { backgroundColor: dot }]} />
                <Text
                    style={[styles.accountName, on && styles.accountNameOn]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
                <View style={[styles.selectMark, on && styles.selectMarkOn]}>
                    <FontAwesomeIcon
                        icon={on ? faCheck : faPlus}
                        size={9}
                        color={on ? colors.onPrimary : colors.textSecondary}
                    />
                </View>
            </Pressable>
        );
    };

    return (
        <View style={embedded ? styles.embedded : styles.card}>
            {/* ── Destinations ─────────────────────────────────────────── */}
            <View style={styles.blockHead}>
                <Text style={styles.blockLabel}>Send to</Text>
                {accounts.length > 0 ? (
                    <Text style={[styles.countBadge, count > 0 && styles.countBadgeOn]}>
                        {count} selected
                    </Text>
                ) : null}
            </View>

            {accounts.length === 0 ? (
                <Text style={styles.emptyAccounts}>
                    No connected accounts yet. Connect Instagram, Facebook or LinkedIn to publish.
                </Text>
            ) : (
                <>
                    <View style={styles.accountRow}>
                        {accounts.map((a) => renderAccountChip(a, isSelected(a.id)))}
                    </View>
                    {count === 0 ? (
                        <Text style={styles.pickHint}>Tap an account to choose where this goes.</Text>
                    ) : null}
                </>
            )}

            {/* ── When ─────────────────────────────────────────────────── */}
            <View style={styles.softDivider} />
            <Text style={styles.blockLabel}>When</Text>

            <DateField
                value={dateValue}
                onChange={onDateChange}
                title="Date of Posting"
                style={styles.dateStatement}
            >
                <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                <View style={styles.dateStatementText}>
                    <Text style={styles.dateStatementLabel}>Scheduled for</Text>
                    <Text style={styles.dateStatementValue}>{formattedDate}</Text>
                </View>
                <View style={styles.changePill}>
                    <FontAwesomeIcon icon={faPenToSquare} size={10} color={colors.primary} />
                    <Text style={styles.changePillText}>Change</Text>
                </View>
            </DateField>

            <Text style={styles.timeQuestion}>What time?</Text>
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

            <Text style={styles.tzHint}>Times shown in your local timezone.</Text>

            {/* ── Actions ──────────────────────────────────────────────── */}
            <Pressable
                style={({ pressed }) => [
                    styles.publishBtn,
                    !canPublish && styles.publishBtnDisabled,
                    pressed && styles.pressed,
                ]}
                onPress={() => onPublish("scheduled")}
                disabled={!canPublish}
            >
                {publishing ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <FontAwesomeIcon icon={faClock} size={14} color={colors.onPrimary} />
                )}
                <Text style={styles.publishBtnText}>
                    {publishing ? "Working…" : "Schedule post"}
                </Text>
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    styles.publishNowLink,
                    !canPublish && styles.publishNowLinkDisabled,
                    pressed && styles.pressed,
                ]}
                onPress={() => setConfirmNow(true)}
                disabled={!canPublish}
                accessibilityRole="button"
                accessibilityLabel="Publish now instead of scheduling"
            >
                <FontAwesomeIcon icon={faBolt} size={12} color={colors.primary} />
                <Text style={styles.publishNowText}>Publish now instead</Text>
            </Pressable>

            {count === 0 ? (
                <Text style={styles.hint}>Select at least one account to continue.</Text>
            ) : null}

            <PublishNowConfirmModal
                visible={confirmNow}
                count={count}
                publishing={publishing}
                onConfirm={() => onPublish("now")}
                onCancel={() => setConfirmNow(false)}
            />
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
        countBadge: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            backgroundColor: colors.tag,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 11,
            overflow: "hidden",
        },
        countBadgeOn: {
            color: colors.onPrimary,
            backgroundColor: colors.primary,
        },
        softDivider: {
            height: 18,
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
            paddingRight: 8,
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
        selectMark: {
            width: 18,
            height: 18,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        selectMarkOn: {
            backgroundColor: colors.onPrimary + "33",
        },
        pickHint: {
            fontSize: 11,
            color: colors.textSecondary,
            marginTop: 8,
        },
        dateStatement: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 11,
            backgroundColor: colors.aliceBlue,
            marginTop: 10,
        },
        dateStatementText: {
            flex: 1,
        },
        dateStatementLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        dateStatementValue: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
            marginTop: 1,
        },
        changePill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: colors.card,
        },
        changePillText: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.primary,
        },
        timeQuestion: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 16,
            marginBottom: 10,
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
            marginTop: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        tzHint: {
            fontSize: 11,
            color: colors.textSecondary,
            marginTop: 10,
        },
        publishBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 18,
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
        publishNowLink: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            marginTop: 10,
            paddingVertical: 9,
            borderRadius: 9,
        },
        publishNowLinkDisabled: {
            opacity: 0.45,
        },
        publishNowText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.primary,
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
