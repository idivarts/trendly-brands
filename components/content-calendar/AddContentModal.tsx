import DateField, { formatDateForWebInput, parseWebInputDate } from "@/components/modals/DateField";
import { SOCIAL_PLATFORM_MAP } from "@/constants/Socials";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBrandSocialContext } from "@/contexts/brand-social-context.provider";
import {
    ALL_CONTENT_FORMATS,
    formatsForPlatform,
    isFormatPlatformCompatible,
} from "@/shared-libs/firestore/trendly-pro/constants/content-format";
import { ALL_PLATFORMS, Platform } from "@/shared-libs/firestore/trendly-pro/constants/platform";
import Colors from "@/shared-uis/constants/Colors";
import TitleTooltip from "@/components/contents/TitleTooltip";
import {
    faCalendarDays,
    faCheck,
    faCircleInfo,
    faPlus,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform as RNPlatform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { CalendarItem, CONTENT_TYPE_LABELS, ContentType } from "./types";
import { fs, lh } from "@/constants/Typography";

/** Extra (non-CalendarItem) fields the modal collects for a new content piece. */
export interface AddContentExtras {
    platforms: Platform[];
}

/**
 * Where the modal was opened from. This drives how the posting date is chosen:
 * - `month`    → a single date selector (the default calendar behaviour).
 * - `week`     → Mon|Tue|…|Sun pills for the days of the viewed week.
 * - `contents` → date is optional and hidden behind a link (deprioritised).
 */
export type AddContentSource = "month" | "week" | "contents";

interface AddContentModalProps {
    visible: boolean;
    initialDate?: string;
    /** Controls the date-selection UI. Defaults to the month-style selector. */
    source?: AddContentSource;
    onClose: () => void;
    onAdd: (item: Omit<CalendarItem, "id">, extras: AddContentExtras) => void;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(d: Date, n: number) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** The 7 consecutive days starting at `start` (used for the weekly pills). */
function weekDaysFrom(start: Date) {
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * The format a freshly opened modal starts on: `reel` when the brand can post
 * one, otherwise the first format its connected platforms do support.
 */
function pickDefaultType(available: ContentType[]): ContentType {
    if (available.includes("reel")) return "reel";
    return available[0] ?? "reel";
}

function formatLongDate(d: Date) {
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

const AddContentModal: React.FC<AddContentModalProps> = ({
    visible,
    initialDate,
    source = "month",
    onClose,
    onAdd,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const router = useRouter();
    const { socialAccounts, isFetchingSocials } = useBrandSocialContext();
    const { hasCapability } = useBrandContext();
    const canConnectSocials = hasCapability("connect_socials");

    // The only platforms offered here are the ones the brand has actually
    // connected — ordered canonically so the chips keep a stable position no
    // matter what order Firestore hands the accounts back in. A platform may
    // have several accounts; it still gets a single chip.
    const connectedPlatforms = useMemo<Platform[]>(() => {
        const connected = new Set<string>(socialAccounts.map((a) => a.platform));
        return ALL_PLATFORMS.filter((p) => connected.has(p));
    }, [socialAccounts]);

    const hasConnectedPlatforms = connectedPlatforms.length > 0;
    // Stable dependency for the effects below — `connectedPlatforms` is a fresh
    // array on every socialAccounts snapshot even when the set is unchanged.
    const connectedKey = connectedPlatforms.join(",");

    // Only formats at least one connected platform can carry are offered. With
    // nothing connected we fall back to the full list: content can be planned
    // before any account is linked.
    const availableTypes = useMemo<ContentType[]>(() => {
        if (!connectedPlatforms.length) return ALL_CONTENT_FORMATS;
        const supported = new Set<ContentType>(
            connectedPlatforms.flatMap((p) => formatsForPlatform(p))
        );
        return ALL_CONTENT_FORMATS.filter((t) => supported.has(t));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectedKey]);

    // The default target platforms for a given format: every connected platform
    // that supports it. Empty when the brand has connected nothing — platforms
    // are optional, so that is a valid state to submit in.
    const defaultPlatformsFor = (t: ContentType): Platform[] =>
        connectedPlatforms.filter((p) => isFormatPlatformCompatible(t, p));

    // The days shown as pills in the weekly view: the 7 days starting at the
    // tapped week's start (or today's week when opened from the header).
    const weekDays = useMemo(() => {
        const base = initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date();
        return weekDaysFrom(base);
    }, [initialDate]);

    // Resolve the initial selected date for the current `source`/`initialDate`.
    // `contents` starts with no date (deprioritised); the calendar views always
    // start on a concrete day.
    const computeInitialDate = (): Date | null => {
        if (source === "contents") return null;
        const base = initialDate ? parseWebInputDate(initialDate) ?? new Date() : new Date();
        if (source === "week") {
            const days = weekDaysFrom(base);
            const today = new Date();
            // Pre-select today when it falls inside the viewed week, else the
            // first day of that week.
            return days.find((d) => isSameDay(d, today)) ?? days[0];
        }
        return base;
    };

    const [date, setDate] = useState<Date | null>(() => computeInitialDate());
    const [type, setType] = useState<ContentType>(() => pickDefaultType(availableTypes));
    const [platforms, setPlatforms] = useState<Platform[]>(() =>
        defaultPlatformsFor(pickDefaultType(availableTypes))
    );
    const [title, setTitle] = useState("");
    const [idea, setIdea] = useState("");

    // Whether the user has hand-picked the platform chips. Until they do, the
    // selection is just a default and is re-seeded as the format changes or the
    // brand's connected accounts arrive; afterwards it is theirs to keep — an
    // empty selection included.
    const platformsTouched = useRef(false);

    // Switching format prunes any now-incompatible platforms. An untouched
    // selection is re-seeded from the new format's defaults instead (handled by
    // the effect below), so moving from Story to Post can widen it back out.
    const handleTypeChange = (t: ContentType) => {
        setType(t);
        if (platformsTouched.current) {
            setPlatforms((prev) =>
                prev.filter((p) => isFormatPlatformCompatible(t, p))
            );
        }
    };

    const togglePlatform = (p: Platform) => {
        if (!isFormatPlatformCompatible(type, p)) return; // disabled chip
        platformsTouched.current = true;
        setPlatforms((prev) =>
            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
        );
    };
    // Contents view only: whether the optional date field has been revealed.
    const [showOptionalDate, setShowOptionalDate] = useState(false);
    // Whether the "why are some platforms disabled?" hint is expanded inline.
    // Kept collapsed by default so the section stays light; the info icon also
    // surfaces the same text as a hover tooltip on web (see TitleTooltip).
    const [showPlatformHint, setShowPlatformHint] = useState(false);

    // The modal stays mounted and is toggled via `visible`, so the useState
    // initialiser only runs once. Re-sync the date each time the modal opens (or
    // the target date / source changes), otherwise it sticks to the first-opened
    // value. `parseWebInputDate` parses the YYYY-MM-DD string as a *local* date
    // (plain `new Date("YYYY-MM-DD")` is UTC and can land on the previous day for
    // negative-offset timezones).
    useEffect(() => {
        if (!visible) return;
        setDate(computeInitialDate());
        setShowOptionalDate(false);
        platformsTouched.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, initialDate, source]);

    // The brand's socials stream in from Firestore, so they can land after the
    // modal is already open — and switching brands changes them outright. Drop
    // a format the connected platforms can no longer carry.
    useEffect(() => {
        if (!visible) return;
        setType((prev) =>
            availableTypes.includes(prev) ? prev : availableTypes[0] ?? prev
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, connectedKey]);

    // Keep an untouched selection in step with the format and with the accounts
    // that are actually connected. Runs on open, on every format change, and
    // when the socials snapshot changes — but never once the user has picked.
    useEffect(() => {
        if (!visible || platformsTouched.current) return;
        setPlatforms(defaultPlatformsFor(type));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, connectedKey, type]);

    const reset = () => {
        const nextType = pickDefaultType(availableTypes);
        setDate(computeInitialDate());
        setType(nextType);
        setPlatforms(defaultPlatformsFor(nextType));
        setTitle("");
        setIdea("");
        setShowOptionalDate(false);
        platformsTouched.current = false;
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Platforms are optional, but the connect link only makes sense for someone
    // who is allowed to add an account. Close first — the modal would otherwise
    // sit on top of the page we navigate to.
    const handleConnectAccounts = () => {
        handleClose();
        router.push("/connected-accounts" as any);
    };

    const handleAdd = () => {
        if (!title.trim()) return;
        onAdd(
            {
                title: title.trim(),
                idea: idea.trim(),
                // Contents view may save with no posting date — the calendar simply
                // won't show it until a date is assigned later.
                date: date ? formatDateForWebInput(date) : "",
                type,
            },
            { platforms }
        );
        reset();
        onClose();
    };

    // Only the title is required — a piece can be planned before the brand has
    // decided (or connected) where it will go.
    const canSubmit = title.trim().length > 0;

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <KeyboardAvoidingView
                    style={styles.backdrop}
                    behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
                    <View style={styles.sheet}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Add Content Item</Text>
                            <Pressable onPress={handleClose} style={styles.closeBtn}>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    size={16}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.body}
                            contentContainerStyle={styles.bodyContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {source === "week" ? (
                                <>
                                    <Text style={styles.label}>Day of Posting</Text>
                                    <View style={styles.weekRow}>
                                        {weekDays.map((d) => {
                                            const selected = !!date && isSameDay(d, date);
                                            return (
                                                <Pressable
                                                    key={formatDateForWebInput(d)}
                                                    style={[
                                                        styles.weekPill,
                                                        selected && styles.weekPillActive,
                                                    ]}
                                                    onPress={() => setDate(d)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.weekPillDow,
                                                            selected && styles.weekPillTextActive,
                                                        ]}
                                                    >
                                                        {WEEKDAY_SHORT[d.getDay()]}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.weekPillNum,
                                                            selected && styles.weekPillTextActive,
                                                        ]}
                                                    >
                                                        {d.getDate()}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </>
                            ) : source === "contents" ? (
                                date ? (
                                    <>
                                        <Text style={styles.label}>Date of Posting</Text>
                                        <View style={styles.dateRowWithClear}>
                                            <DateField
                                                value={date}
                                                onChange={setDate}
                                                style={[styles.dateRow, styles.flex1]}
                                            >
                                                <Text style={styles.dateText}>
                                                    {formatLongDate(date)}
                                                </Text>
                                                <FontAwesomeIcon
                                                    icon={faCalendarDays}
                                                    size={14}
                                                    color={colors.primary}
                                                />
                                            </DateField>
                                            <Pressable
                                                style={styles.clearDateBtn}
                                                onPress={() => {
                                                    setDate(null);
                                                    setShowOptionalDate(false);
                                                }}
                                                hitSlop={8}
                                                accessibilityLabel="Remove posting date"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faXmark}
                                                    size={14}
                                                    color={colors.textSecondary}
                                                />
                                            </Pressable>
                                        </View>
                                    </>
                                ) : showOptionalDate ? (
                                    <>
                                        <Text style={styles.label}>Date of Posting</Text>
                                        <DateField
                                            value={null}
                                            onChange={setDate}
                                            style={styles.dateRow}
                                        >
                                            <Text style={styles.datePlaceholder}>
                                                Select a date
                                            </Text>
                                            <FontAwesomeIcon
                                                icon={faCalendarDays}
                                                size={14}
                                                color={colors.primary}
                                            />
                                        </DateField>
                                    </>
                                ) : (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.addDateLink,
                                            pressed && styles.addDateLinkPressed,
                                        ]}
                                        onPress={() => setShowOptionalDate(true)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            size={13}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.addDateLinkText}>
                                            Add a posting date (optional)
                                        </Text>
                                    </Pressable>
                                )
                            ) : (
                                <>
                                    <Text style={styles.label}>Date of Posting</Text>
                                    <DateField
                                        value={date}
                                        onChange={setDate}
                                        style={styles.dateRow}
                                    >
                                        <Text style={styles.dateText}>
                                            {date ? formatLongDate(date) : "Select a date"}
                                        </Text>
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            size={14}
                                            color={colors.primary}
                                        />
                                    </DateField>
                                </>
                            )}

                            <Text style={styles.label}>Content Type</Text>
                            <View style={styles.typeRow}>
                                {availableTypes.map((t) => (
                                    <Pressable
                                        key={t}
                                        style={({ pressed }) => [
                                            styles.typeChip,
                                            type === t && styles.typeChipActive,
                                            pressed && styles.typeChipPressed,
                                        ]}
                                        onPress={() => handleTypeChange(t)}
                                    >
                                        <Text
                                            style={[
                                                styles.typeChipText,
                                                type === t && styles.typeChipTextActive,
                                            ]}
                                        >
                                            {CONTENT_TYPE_LABELS[t]}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View style={styles.labelRow}>
                                <Text style={styles.labelInline}>Platforms</Text>
                                {hasConnectedPlatforms && (
                                    <>
                                        <TitleTooltip text="Only your connected accounts are listed. Ones the selected content type can't be posted to are disabled.">
                                            <Pressable
                                                onPress={() => setShowPlatformHint((v) => !v)}
                                                hitSlop={8}
                                                style={styles.infoBtn}
                                                accessibilityLabel="Why are some platforms disabled?"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faCircleInfo}
                                                    size={13}
                                                    color={colors.textSecondary}
                                                />
                                            </Pressable>
                                        </TitleTooltip>
                                        <Text style={styles.selectAllHint}>
                                            Optional — select all that apply
                                        </Text>
                                    </>
                                )}
                            </View>
                            {hasConnectedPlatforms && showPlatformHint && (
                                <Text style={styles.helperText}>
                                    Only your connected accounts are listed. Ones the
                                    selected content type can&apos;t be posted to are
                                    disabled.
                                </Text>
                            )}
                            {!hasConnectedPlatforms ? (
                                isFetchingSocials ? (
                                    <ActivityIndicator
                                        color={colors.primary}
                                        style={styles.platformsLoader}
                                    />
                                ) : (
                                    <View style={styles.noSocials}>
                                        <Text style={styles.noSocialsText}>
                                            No social accounts connected yet. You can still
                                            plan this content and choose platforms later.
                                        </Text>
                                        {canConnectSocials && (
                                            <Pressable
                                                onPress={handleConnectAccounts}
                                                style={({ pressed }) => [
                                                    styles.connectLink,
                                                    pressed && styles.connectLinkPressed,
                                                ]}
                                                accessibilityRole="link"
                                                accessibilityLabel="Connect a social account"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPlus}
                                                    size={11}
                                                    color={colors.primary}
                                                />
                                                <Text style={styles.connectLinkText}>
                                                    Connect an account
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                )
                            ) : (
                                <View style={styles.typeRow}>
                                    {connectedPlatforms.map((p) => {
                                        const meta = SOCIAL_PLATFORM_MAP[p];
                                        const compatible = isFormatPlatformCompatible(type, p);
                                        const selected = platforms.includes(p);
                                        return (
                                            <Pressable
                                                key={p}
                                                disabled={!compatible}
                                                style={({ pressed }) => [
                                                    styles.platformChip,
                                                    selected && styles.typeChipActive,
                                                    !compatible && styles.typeChipDisabled,
                                                    pressed && compatible && styles.typeChipPressed,
                                                ]}
                                                onPress={() => togglePlatform(p)}
                                            >
                                                {meta && (
                                                    <FontAwesomeIcon
                                                        icon={meta.icon}
                                                        size={14}
                                                        color={
                                                            selected
                                                                ? colors.onPrimary
                                                                : colors[meta.colorKey]
                                                        }
                                                    />
                                                )}
                                                <Text
                                                    style={[
                                                        styles.typeChipText,
                                                        selected && styles.typeChipTextActive,
                                                    ]}
                                                >
                                                    {meta?.label ?? p}
                                                </Text>
                                                {selected && (
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        size={11}
                                                        color={colors.onPrimary}
                                                    />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="E.g. Founder Story Launch Reel"
                                placeholderTextColor={colors.textSecondary}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={120}
                            />

                            <Text style={styles.label}>Idea / Vision</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the concept, mood, or key message..."
                                placeholderTextColor={colors.textSecondary}
                                value={idea}
                                onChangeText={setIdea}
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                            />
                        </ScrollView>

                        <View style={styles.footer}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.cancelBtn,
                                    pressed && styles.btnPressed,
                                ]}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.addBtn,
                                    pressed && styles.btnPressed,
                                    !canSubmit && styles.addBtnDisabled,
                                ]}
                                onPress={handleAdd}
                                disabled={!canSubmit}
                            >
                                <Text style={styles.addBtnText}>Add to Calendar</Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.backdrop,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                },
                sheet: {
                    width: "100%",
                    maxWidth: 520,
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 12 },
                    shadowRadius: 32,
                    shadowOpacity: 0.18,
                    elevation: 12,
                    maxHeight: "90%",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 2,
                },
                headerTitle: {
                    fontSize: fs(17),
                    fontWeight: "700",
                    color: colors.text,
                },
                closeBtn: {
                    padding: 4,
                },
                body: {
                    flexShrink: 1,
                },
                bodyContent: {
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 8,
                    gap: 4,
                },
                label: {
                    fontSize: fs(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 6,
                    marginTop: 12,
                },
                labelRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 12,
                    marginBottom: 6,
                },
                labelInline: {
                    fontSize: fs(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                infoBtn: {
                    padding: 2,
                },
                selectAllHint: {
                    marginLeft: "auto",
                    fontSize: fs(11),
                    fontWeight: "500",
                    color: colors.textSecondary,
                    opacity: 0.8,
                },
                dateRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                dateText: {
                    fontSize: fs(14),
                    color: colors.text,
                    fontWeight: "500",
                },
                datePlaceholder: {
                    fontSize: fs(14),
                    color: colors.textSecondary,
                    fontWeight: "500",
                },
                dateRowWithClear: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                },
                flex1: {
                    flex: 1,
                },
                clearDateBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.tag,
                },
                addDateLink: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "flex-start",
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                },
                addDateLinkPressed: {
                    opacity: 0.6,
                },
                addDateLinkText: {
                    fontSize: fs(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                weekRow: {
                    flexDirection: "row",
                    gap: 6,
                },
                weekPill: {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                weekPillActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                weekPillDow: {
                    fontSize: fs(11),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                weekPillNum: {
                    fontSize: fs(15),
                    fontWeight: "700",
                    color: colors.text,
                    marginTop: 2,
                },
                weekPillTextActive: {
                    color: colors.onPrimary,
                },
                typeRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                },
                typeChip: {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                platformChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingLeft: 12,
                    paddingRight: 13,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: colors.tag,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                typeChipActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                typeChipPressed: {
                    opacity: 0.75,
                },
                typeChipDisabled: {
                    opacity: 0.35,
                },
                helperText: {
                    fontSize: fs(11),
                    color: colors.textSecondary,
                    marginBottom: 8,
                    marginTop: -2,
                },
                platformsLoader: {
                    alignSelf: "flex-start",
                    marginVertical: 10,
                },
                noSocials: {
                    gap: 4,
                    alignItems: "flex-start",
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                noSocialsText: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.textSecondary,
                },
                connectLink: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 4,
                },
                connectLinkPressed: {
                    opacity: 0.6,
                },
                connectLinkText: {
                    fontSize: fs(13),
                    fontWeight: "700",
                    color: colors.primary,
                    textDecorationLine: "underline",
                },
                typeChipText: {
                    fontSize: fs(13),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                typeChipTextActive: {
                    color: colors.onPrimary,
                },
                input: {
                    backgroundColor: colors.tag,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: fs(14),
                    color: colors.text,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowRadius: 3,
                    shadowOpacity: 0.04,
                    elevation: 1,
                },
                textArea: {
                    minHeight: 100,
                    maxHeight: 180,
                },
                footer: {
                    flexDirection: "row",
                    gap: 12,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.05,
                    elevation: 3,
                },
                cancelBtn: {
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.tag,
                },
                cancelBtnText: {
                    fontSize: fs(14),
                    fontWeight: "600",
                    color: colors.textSecondary,
                },
                addBtn: {
                    flex: 2,
                    paddingVertical: 13,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                addBtnDisabled: {
                    opacity: 0.45,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                addBtnText: {
                    fontSize: fs(14),
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                btnPressed: {
                    opacity: 0.72,
                },
            }),
        [colors]
    );
}

export default AddContentModal;
