import { UpgradeInline } from "@/components/billing/EntitlementGate";
import { ISocialAccount } from "@/contexts/brand-social-context.provider";
import { PlatformOptions, ScheduleMode, SocialDestination } from "@/components/contents/types";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { useEntitlements } from "@/hooks/use-entitlements";
import { Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import { useBreakpoints } from "@/hooks";
import {
    faArrowLeft,
    faBolt,
    faCalendarCheck,
    faCalendarDays,
    faLayerGroup,
    faPaperPlane,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import DestinationPicker from "./DestinationPicker";
import ScheduleFields from "./ScheduleFields";
import { fs, lh } from "@/constants/Typography";
import {
    composeScheduledAt,
    defaultScheduleAt,
    formatScheduleSentence,
    isScheduleInPast,
    toTimeString,
} from "./schedule-presets";
import { destinationBlockMap, PublishReadinessInput } from "./publish-readiness";

// ─── PublishModal ─────────────────────────────────────────────────────────────
// Two steps, because "post now" and "schedule" are different decisions and used
// to be presented as one.
//
//   1. "mode"     — where it goes (destinations) + WHICH of the two things you
//                   want, as two equal cards.
//   2. "now"      — confirm the irreversible live publish.
//      "schedule" — pick the time (pre-filled with the next good slot) and
//                   confirm.
//
// What this replaces: a single screen that showed destinations, a date picker
// and a time chip row all at once, with a big primary "Schedule post" button and
// "Publish now instead" demoted to a text link. Three problems with that:
//
//   • Date and time were dead weight for anyone publishing immediately.
//   • The destructive action got the quiet treatment while the reversible one
//     got the loud button.
//   • Only "publish now" had a confirm step. Since an unset time fell back to
//     09:00 and the backend clamped a past timestamp to "now", the SCHEDULE
//     button could fire an unconfirmed irreversible publish. Both paths confirm
//     now, and the time can no longer default into the past.
//
// The confirms are steps in THIS modal rather than a nested <Modal>. The old
// nested PublishNowConfirmModal needed a `wasPublishing` ref to avoid lingering
// on screen after its parent closed; a step can't outlive its container.

type Step = "mode" | "now" | "schedule";

export interface PublishModalProps {
    visible: boolean;
    onClose: () => void;
    socialAccounts: ISocialAccount[];
    destinations: SocialDestination[];
    onDestinationsChange: (next: SocialDestination[]) => void;
    platformOptions: PlatformOptions;
    onPlatformOptionsChange: (next: PlatformOptions) => void;
    dateValue: Date;
    onDateChange: (next: Date) => void;
    timeOfPosting: string;
    onTimeChange: (t: string) => void;
    onPublish: (mode: ScheduleMode) => void;
    publishing: boolean;
    /** Content fields the per-destination readiness checks need. */
    readiness: PublishReadinessInput;
    /** Platforms that have a per-platform variation (publish from it, not Generic). */
    variationPlatforms?: Platform[];
    /** Platforms whose option fields are edited elsewhere. */
    hideOptionPlatforms?: string[];
}

const PublishModal: React.FC<PublishModalProps> = ({
    visible,
    onClose,
    socialAccounts,
    destinations,
    onDestinationsChange,
    platformOptions,
    onPlatformOptionsChange,
    dateValue,
    onDateChange,
    timeOfPosting,
    onTimeChange,
    onPublish,
    publishing,
    readiness,
    variationPlatforms = [],
    hideOptionPlatforms = [],
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useStyles(colors, xl);

    const [step, setStep] = useState<Step>("mode");

    // Reopening always starts at the mode choice — a half-finished step from a
    // previous open must never be what greets the user.
    useEffect(() => {
        if (visible) setStep("mode");
    }, [visible]);

    // The parent stores date and time-of-day separately (they're separate fields
    // on the content doc), but the user decides about ONE moment. Compose on the
    // way in, decompose on the way out.
    const scheduledAt = useMemo(
        () => composeScheduledAt(dateValue, timeOfPosting),
        [dateValue, timeOfPosting]
    );
    const applyScheduledAt = (next: Date) => {
        onDateChange(next);
        onTimeChange(toTimeString(next));
    };

    // Entering the schedule step with an unset or already-passed time lands on
    // the next sensible slot rather than today-at-09:00.
    const openScheduleStep = () => {
        if (!timeOfPosting || isScheduleInPast(scheduledAt)) {
            applyScheduledAt(defaultScheduleAt());
        }
        setStep("schedule");
    };

    const blockedReasons = useMemo(
        () => destinationBlockMap(destinations, platformOptions, readiness),
        [destinations, platformOptions, readiness]
    );

    // A destination that can't publish yet blocks the whole send, rather than
    // being quietly dropped. The publish endpoint takes no destination subset
    // (only RetryPublish derives one server-side), so there is no way to
    // actually skip one — it would be attempted and fail, landing the content in
    // `partially_failed`. Better to say so now: the fix is either filling the
    // field right above, or one tap to deselect.
    const readyCount = destinations.filter((d) => !blockedReasons.has(d.socialAccountId)).length;
    const blockedCount = destinations.length - readyCount;
    const canProceed = readyCount > 0 && blockedCount === 0 && !publishing;
    const scheduleValid = !isScheduleInPast(scheduledAt);

    // Which selected destinations will post from their own variation.
    const variationLabels = useMemo(() => {
        const set = new Set(variationPlatforms);
        return destinations
            .filter((d) => set.has(d.platform))
            .map((d) => SOCIAL_PLATFORM_MAP[d.platform]?.label ?? d.platform)
            .filter((v, i, a) => a.indexOf(v) === i);
    }, [variationPlatforms, destinations]);

    // Posting cap is a free-plan entitlement (maxPostsPerMonth; -1 = unlimited).
    const { maxPostsPerMonth } = useEntitlements();

    const accountLabel = readyCount === 1 ? "1 account" : `${readyCount} accounts`;

    const header = () => {
        const titles: Record<Step, { title: string; subtitle: string }> = {
            mode: { title: "Publish or schedule", subtitle: "Choose where this goes, then when" },
            now: { title: "Post now?", subtitle: `Goes live on ${accountLabel} immediately` },
            schedule: { title: "Schedule this post", subtitle: `Goes out to ${accountLabel}` },
        };
        const { title, subtitle } = titles[step];
        return (
            <View style={styles.header}>
                {step === "mode" ? (
                    <View style={styles.headIcon}>
                        <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.primary} />
                    </View>
                ) : (
                    <Pressable
                        onPress={() => setStep("mode")}
                        disabled={publishing}
                        style={({ pressed }) => [styles.headIcon, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Back to publish options"
                        hitSlop={8}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} size={14} color={colors.primary} />
                    </Pressable>
                )}
                <View style={styles.headText}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={8}
                >
                    <FontAwesomeIcon icon={faXmark} size={16} color={colors.textSecondary} />
                </Pressable>
            </View>
        );
    };

    const modeStep = () => (
        <>
            {maxPostsPerMonth >= 0 ? (
                <View style={styles.gateRow}>
                    <UpgradeInline
                        feature="posting_cap"
                        message={`Free plan includes ${maxPostsPerMonth} posts/month — upgrade for unlimited scheduling.`}
                    />
                </View>
            ) : null}

            {variationLabels.length > 0 ? (
                <View style={styles.variationNote}>
                    <FontAwesomeIcon icon={faLayerGroup} size={12} color={colors.primary} />
                    <Text style={styles.variationNoteText}>
                        {variationLabels.join(", ")} will post from{" "}
                        {variationLabels.length > 1 ? "their" : "its"} own variation. Other
                        platforms use the Generic content.
                    </Text>
                </View>
            ) : null}

            <DestinationPicker
                socialAccounts={socialAccounts}
                destinations={destinations}
                onDestinationsChange={onDestinationsChange}
                platformOptions={platformOptions}
                onPlatformOptionsChange={onPlatformOptionsChange}
                blockedReasons={blockedReasons}
                hideOptionPlatforms={hideOptionPlatforms}
            />

            <View style={styles.divider} />
            <Text style={styles.blockLabel}>When</Text>

            <View style={styles.modeRow}>
                <Pressable
                    style={({ pressed }) => [
                        styles.modeCard,
                        !canProceed && styles.modeCardDisabled,
                        pressed && styles.pressed,
                    ]}
                    onPress={() => setStep("now")}
                    disabled={!canProceed}
                    accessibilityRole="button"
                    accessibilityLabel="Post now — goes live immediately"
                >
                    <FontAwesomeIcon icon={faBolt} size={19} color={colors.textSecondary} />
                    <Text style={styles.modeTitle}>Post now</Text>
                    <Text style={styles.modeHint}>Goes live immediately</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [
                        styles.modeCard,
                        styles.modeCardPrimary,
                        !canProceed && styles.modeCardDisabled,
                        pressed && styles.pressed,
                    ]}
                    onPress={openScheduleStep}
                    disabled={!canProceed}
                    accessibilityRole="button"
                    accessibilityLabel="Schedule — pick a date and time"
                >
                    <FontAwesomeIcon icon={faCalendarDays} size={19} color={colors.primary} />
                    <Text style={[styles.modeTitle, styles.modeTitlePrimary]}>Schedule</Text>
                    <Text style={styles.modeHint}>
                        {timeOfPosting && !isScheduleInPast(scheduledAt)
                            ? formatScheduleSentence(scheduledAt)
                            : "Pick a date and time"}
                    </Text>
                </Pressable>
            </View>

            {destinations.length === 0 ? (
                <Text style={styles.hint}>Select at least one account to continue.</Text>
            ) : blockedCount > 0 ? (
                <Text style={styles.hintWarn}>
                    {blockedCount === 1
                        ? "One account still needs a detail above. Fill it in, or tap the account to remove it."
                        : `${blockedCount} accounts still need details above. Fill them in, or tap an account to remove it.`}
                </Text>
            ) : null}
        </>
    );

    const nowStep = () => (
        <>
            <Text style={styles.confirmBody}>
                This posts to {accountLabel} right away. Once it&apos;s live you can&apos;t undo it
                from Trendly.
            </Text>
            <Pressable
                style={({ pressed }) => [
                    styles.primaryBtn,
                    publishing && styles.primaryBtnDisabled,
                    pressed && styles.pressed,
                ]}
                onPress={() => onPublish("now")}
                disabled={publishing}
                accessibilityRole="button"
                accessibilityLabel="Post now"
            >
                {publishing ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <>
                        <FontAwesomeIcon icon={faBolt} size={14} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>Post now</Text>
                    </>
                )}
            </Pressable>
            <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={() => setStep("mode")}
                disabled={publishing}
                accessibilityRole="button"
                accessibilityLabel="Back"
            >
                <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
        </>
    );

    const scheduleStep = () => (
        <>
            <ScheduleFields value={scheduledAt} onChange={applyScheduledAt} />
            <Pressable
                style={({ pressed }) => [
                    styles.primaryBtn,
                    (publishing || !scheduleValid) && styles.primaryBtnDisabled,
                    pressed && styles.pressed,
                ]}
                onPress={() => onPublish("scheduled")}
                disabled={publishing || !scheduleValid}
                accessibilityRole="button"
                accessibilityLabel={`Schedule for ${formatScheduleSentence(scheduledAt)}`}
            >
                {publishing ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                    <>
                        <FontAwesomeIcon
                            icon={faCalendarCheck}
                            size={14}
                            color={colors.onPrimary}
                        />
                        {/* The button restates the whole decision, so the user
                            never has to assemble it from two controls. */}
                        <Text style={styles.primaryBtnText}>
                            Schedule for {formatScheduleSentence(scheduledAt)}
                        </Text>
                    </>
                )}
            </Pressable>
            <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={() => setStep("mode")}
                disabled={publishing}
                accessibilityRole="button"
                accessibilityLabel="Back"
            >
                <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
        </>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={publishing ? undefined : onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close publish options"
                />
                <View style={styles.sheet} accessibilityViewIsModal>
                    {header()}
                    <ScrollView
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        {step === "mode" ? modeStep() : null}
                        {step === "now" ? nowStep() : null}
                        {step === "schedule" ? scheduleStep() : null}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: colors.backdrop,
            alignItems: "center",
            justifyContent: xl ? "center" : "flex-end",
            padding: xl ? 20 : 0,
        },
        sheet: {
            width: "100%",
            maxWidth: 480,
            maxHeight: "88%",
            backgroundColor: colors.card,
            borderRadius: xl ? 18 : 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 14,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
        },
        headIcon: {
            width: 32,
            height: 32,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.aliceBlue,
        },
        headText: {
            flex: 1,
        },
        title: {
            fontSize: fs(16),
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: fs(12),
            fontWeight: "600",
            color: colors.textSecondary,
            marginTop: 1,
        },
        closeBtn: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        body: {
            paddingHorizontal: 18,
            paddingTop: 4,
            paddingBottom: 20,
        },
        gateRow: {
            marginBottom: 12,
        },
        variationNote: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            padding: 12,
            borderRadius: 10,
            backgroundColor: colors.aliceBlue,
            marginBottom: 12,
        },
        variationNoteText: {
            flex: 1,
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.textSecondary,
        },
        divider: {
            height: 18,
        },
        blockLabel: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 10,
        },
        modeRow: {
            flexDirection: "row",
            gap: 10,
        },
        modeCard: {
            flex: 1,
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
        },
        modeCardPrimary: {
            backgroundColor: colors.aliceBlue,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 10,
            shadowOpacity: 0.18,
            elevation: 3,
        },
        modeCardDisabled: {
            opacity: 0.45,
        },
        modeTitle: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.text,
            marginTop: 7,
        },
        modeTitlePrimary: {
            color: colors.primary,
        },
        modeHint: {
            fontSize: fs(11),
            color: colors.textSecondary,
            marginTop: 2,
            textAlign: "center",
            lineHeight: lh(15),
        },
        confirmBody: {
            fontSize: fs(13),
            color: colors.textSecondary,
            lineHeight: lh(19),
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 48,
            marginTop: 18,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnDisabled: {
            opacity: 0.45,
            shadowOpacity: 0,
            elevation: 0,
        },
        primaryBtnText: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.onPrimary,
            textAlign: "center",
        },
        secondaryBtn: {
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
        },
        secondaryBtnText: {
            fontSize: fs(13),
            fontWeight: "600",
            color: colors.textSecondary,
        },
        hint: {
            fontSize: fs(11),
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 10,
        },
        hintWarn: {
            fontSize: fs(11),
            fontWeight: "600",
            color: colors.errorBannerText,
            textAlign: "center",
            marginTop: 10,
            lineHeight: lh(16),
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default PublishModal;
