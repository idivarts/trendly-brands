import DateField from "@/components/modals/DateField";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import {
    faArrowRotateRight,
    faCalendarDay,
    faCheck,
    faCircleCheck,
    faClock,
    faLayerGroup,
    faPenToSquare,
    faTrashCan,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Fallback used when a strategy has no campaign window recorded at creation.
const DEFAULT_DURATION_DAYS = 30;
const DAY_MS = 86_400_000;

export interface PushToCalendarConfirm {
    startDate: Date;
    durationDays: number;
    overrideExisting: boolean;
}

interface PushToCalendarModalProps {
    visible: boolean;
    strategyTitle: string;
    /** Campaign window length fixed at creation; falls back to 30 days. */
    durationDays?: number;
    onClose: () => void;
    onConfirm: (opts: PushToCalendarConfirm) => void;
    /**
     * Re-derive the duration with AI from the current strategy body — used when
     * the user has manually edited the doc and the recorded length is stale.
     * Resolves with the corrected day count, or null if it couldn't determine one.
     */
    onRefreshDuration?: () => Promise<number | null>;
}

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function friendlyDate(d: Date): string {
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const PushToCalendarModal: React.FC<PushToCalendarModalProps> = ({
    visible,
    strategyTitle,
    durationDays,
    onClose,
    onConfirm,
    onRefreshDuration,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

    const [startDate, setStartDate] = useState<Date>(startOfToday);
    const [overrideExisting, setOverrideExisting] = useState(false);

    // AI-rechecked duration takes precedence over the value recorded at creation.
    const [refreshedDuration, setRefreshedDuration] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [didRefresh, setDidRefresh] = useState(false);

    // Reset the recheck state each time the modal is reopened.
    useEffect(() => {
        if (!visible) {
            setRefreshedDuration(null);
            setRefreshing(false);
            setDidRefresh(false);
        }
    }, [visible]);

    const recordedDuration = durationDays && durationDays > 0 ? durationDays : undefined;
    const effectiveDuration = refreshedDuration ?? recordedDuration ?? DEFAULT_DURATION_DAYS;
    const isDefaultDuration = refreshedDuration == null && recordedDuration == null;

    const handleRefreshDuration = async () => {
        if (!onRefreshDuration || refreshing) return;
        setRefreshing(true);
        try {
            const next = await onRefreshDuration();
            if (next && next > 0) {
                setRefreshedDuration(next);
                setDidRefresh(true);
            } else {
                Toaster.info(
                    "Couldn't read a length",
                    "The AI couldn't find a clear duration in the strategy. Adjust the doc and try again."
                );
            }
        } catch {
            Toaster.error("Re-check failed", "Something went wrong reading the strategy. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    // End date is inclusive of the start day: a 30-day run ending on day 30.
    const endDate = useMemo(() => {
        const d = new Date(startDate.getTime() + (effectiveDuration - 1) * DAY_MS);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [startDate, effectiveDuration]);

    const handleConfirm = () => {
        onConfirm({ startDate, durationDays: effectiveDuration, overrideExisting });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            onDismiss={onClose}
        >
            <View style={styles.root}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={styles.card} onPress={() => { }}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* ── Header ─────────────────────────────────────── */}
                            <Text style={styles.title}>Push strategy to calendar</Text>
                            <Text style={styles.subtitle} numberOfLines={2}>
                                Turn “{strategyTitle}” into scheduled content ideas across your calendar.
                            </Text>

                            {/* ── Start date ─────────────────────────────────── */}
                            <Text style={styles.sectionLabel}>Start date</Text>
                            <DateField
                                value={startDate}
                                onChange={setStartDate}
                                minimumDate={startOfToday()}
                                title="Strategy start date"
                                style={styles.dateField}
                            >
                                <View style={styles.dateIcon}>
                                    <FontAwesomeIcon icon={faCalendarDay} size={15} color={colors.primary} />
                                </View>
                                <View style={styles.dateTextWrap}>
                                    <Text style={styles.dateValue}>{friendlyDate(startDate)}</Text>
                                    <Text style={styles.dateHint}>The strategy begins on this day</Text>
                                </View>
                                <FontAwesomeIcon icon={faPenToSquare} size={14} color={colors.textSecondary} />
                            </DateField>

                            {/* ── Duration (read-only) ───────────────────────── */}
                            <Text style={styles.sectionLabel}>Duration</Text>
                            <View style={styles.infoCard}>
                                <View style={styles.dateIcon}>
                                    <FontAwesomeIcon icon={faClock} size={15} color={colors.primary} />
                                </View>
                                <View style={styles.dateTextWrap}>
                                    <Text style={styles.dateValue}>
                                        Runs for {effectiveDuration} days
                                    </Text>
                                    <Text style={styles.dateHint}>
                                        Fills your calendar through {friendlyDate(endDate)}
                                        {isDefaultDuration ? " · default length" : ""}
                                    </Text>
                                </View>
                            </View>

                            {/* ── AI re-check of duration ────────────────────── */}
                            {onRefreshDuration && (
                                refreshing ? (
                                    <View style={styles.recheckRow}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={styles.recheckHint}>Re-checking the strategy…</Text>
                                    </View>
                                ) : didRefresh ? (
                                    <View style={styles.recheckRow}>
                                        <FontAwesomeIcon icon={faCircleCheck} size={13} color={colors.toastSuccess} />
                                        <Text style={[styles.recheckHint, { color: colors.toastSuccess }]}>
                                            Updated from your latest edits
                                        </Text>
                                    </View>
                                ) : (
                                    <Pressable
                                        style={({ pressed }) => [styles.recheckRow, pressed && styles.pressed]}
                                        onPress={handleRefreshDuration}
                                        accessibilityLabel="Re-check duration with AI"
                                    >
                                        <FontAwesomeIcon icon={faArrowRotateRight} size={13} color={colors.primary} />
                                        <Text style={styles.recheckLink}>
                                            Edited the strategy? Re-check the length with AI
                                        </Text>
                                    </Pressable>
                                )
                            )}

                            {/* ── Override choice ────────────────────────────── */}
                            <Text style={styles.sectionLabel}>If dates already have content</Text>

                            <OptionRow
                                styles={styles}
                                colors={colors}
                                selected={!overrideExisting}
                                icon={faLayerGroup}
                                title="Keep existing items"
                                desc="New ideas are added alongside whatever is already scheduled."
                                onPress={() => setOverrideExisting(false)}
                            />
                            <OptionRow
                                styles={styles}
                                colors={colors}
                                selected={overrideExisting}
                                icon={faTrashCan}
                                title="Replace existing items"
                                desc="Content already on these dates is removed before the strategy fills them."
                                onPress={() => setOverrideExisting(true)}
                            />
                        </ScrollView>

                        {/* ── Footer ─────────────────────────────────────────── */}
                        <View style={styles.actions}>
                            <Pressable
                                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                                onPress={handleConfirm}
                            >
                                <FontAwesomeIcon icon={faCheck} size={13} color={colors.onPrimary} />
                                <Text style={styles.confirmBtnText}>Push to calendar</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </View>
        </Modal>
    );
};

// ── Override option row ─────────────────────────────────────────────────────

const OptionRow: React.FC<{
    styles: ReturnType<typeof createStyles>;
    colors: ReturnType<typeof Colors>;
    selected: boolean;
    icon: typeof faLayerGroup;
    title: string;
    desc: string;
    onPress: () => void;
}> = ({ styles, colors, selected, icon, title, desc, onPress }) => (
    <Pressable
        style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
        onPress={onPress}
    >
        <FontAwesomeIcon
            icon={icon}
            size={15}
            color={selected ? colors.onPrimary : colors.textSecondary}
        />
        <View style={styles.optionText}>
            <Text style={[styles.optionTitle, selected && { color: colors.onPrimary }]}>{title}</Text>
            <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>{desc}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected && <FontAwesomeIcon icon={faCheck} size={10} color={colors.onPrimary} />}
        </View>
    </Pressable>
);

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.backdrop,
        },
        overlay: {
            flex: 1,
            backgroundColor: colors.transparent,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: safeAreaTop,
            paddingHorizontal: 16,
        },
        card: {
            width: "100%",
            maxWidth: 480,
            maxHeight: "88%",
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingTop: 20,
            paddingBottom: 16,
            paddingHorizontal: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 16,
        },
        scrollContent: {
            paddingBottom: 4,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 4,
            lineHeight: 18,
        },
        sectionLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            marginTop: 18,
            marginBottom: 8,
        },
        dateField: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        infoCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
        },
        dateIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        dateTextWrap: {
            flex: 1,
            minWidth: 0,
        },
        dateValue: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        dateHint: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        recheckRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 2,
            marginTop: 2,
        },
        recheckLink: {
            fontSize: 12.5,
            fontWeight: "600",
            color: colors.primary,
        },
        recheckHint: {
            fontSize: 12.5,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        option: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
            marginBottom: 8,
        },
        optionSelected: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        optionText: {
            flex: 1,
            minWidth: 0,
        },
        optionTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        optionDesc: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
            lineHeight: 16,
        },
        optionDescSelected: {
            color: colors.onPrimary,
            opacity: 0.85,
        },
        radio: {
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        radioSelected: {
            backgroundColor: colors.onPrimary + "33",
        },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 16,
        },
        cancelBtn: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        cancelBtnText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        confirmBtn: {
            flex: 1.4,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        confirmBtnText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        pressed: {
            opacity: 0.75,
        },
    });
}

export default PushToCalendarModal;
