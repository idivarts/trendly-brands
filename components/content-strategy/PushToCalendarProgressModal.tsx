import Colors from "@/shared-uis/constants/Colors";
import { aiWS } from "@/utils/ai-ws";
import {
    faCalendarCheck,
    faCircleCheck,
    faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// One streamed progress line from the backend.
interface ProgressStep {
    id: string;
    phase: string;
    message: string;
}

type Phase = "running" | "success" | "error";

interface DoneInfo {
    createdCount: number;
    removedCount: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
}

interface PushToCalendarProgressModalProps {
    visible: boolean;
    brandId: string;
    strategyId: string;
    /** YYYY-MM-DD — where the campaign begins. */
    startDate: string;
    durationDays: number;
    overrideExisting: boolean;
    onClose: () => void;
    /** Land the user on the calendar at the campaign's start date. */
    onViewCalendar: (focusDate: string) => void;
}

function friendlyDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PushToCalendarProgressModal: React.FC<PushToCalendarProgressModalProps> = ({
    visible,
    brandId,
    strategyId,
    startDate,
    durationDays,
    overrideExisting,
    onClose,
    onViewCalendar,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

    const [phase, setPhase] = useState<Phase>("running");
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [done, setDone] = useState<DoneInfo | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const jobIdRef = useRef<string>("");
    const scrollRef = useRef<ScrollView>(null);

    // Kick off a WS job: connect, send the request, and stream back progress.
    // Returns a teardown that removes the listener for this job.
    const runJob = useCallback(() => {
        const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        jobIdRef.current = jobId;
        setPhase("running");
        setSteps([]);
        setDone(null);
        setErrorMsg("");

        const remove = aiWS.addListener((msg: any) => {
            // Only react to this job's namespaced calendar frames.
            if (!msg || msg.jobId !== jobId) return;
            if (msg.type === "calendar_status") {
                setSteps((prev) => [
                    ...prev,
                    {
                        id: `${prev.length}-${msg.phase ?? ""}`,
                        phase: msg.phase ?? "",
                        message: typeof msg.message === "string" ? msg.message : "",
                    },
                ]);
            } else if (msg.type === "calendar_done") {
                setDone({
                    createdCount: Number(msg.createdCount ?? 0),
                    removedCount: Number(msg.removedCount ?? 0),
                    startDate: msg.startDate ?? startDate,
                    endDate: msg.endDate ?? startDate,
                });
                setPhase("success");
            } else if (msg.type === "calendar_error") {
                setErrorMsg(
                    typeof msg.message === "string" && msg.message
                        ? msg.message
                        : "Something went wrong. Please try again."
                );
                setPhase("error");
            }
        });

        aiWS
            .send({
                type: "push_to_calendar",
                brandId,
                contextId: strategyId,
                payload: { startDate, durationDays, overrideExisting, jobId },
            })
            .catch(() => {
                setErrorMsg("Couldn't reach the server. Check your connection and try again.");
                setPhase("error");
            });

        return remove;
    }, [brandId, strategyId, startDate, durationDays, overrideExisting]);

    // Run once each time the modal opens; tear the listener down on close/unmount.
    useEffect(() => {
        if (!visible) return;
        const remove = runJob();
        return () => {
            jobIdRef.current = "";
            remove();
        };
    }, [visible, runJob]);

    // Keep the newest streamed line in view.
    useEffect(() => {
        if (steps.length > 0) {
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        }
    }, [steps.length]);

    const handleRetry = useCallback(() => {
        // The open-effect's cleanup removed the prior listener; start fresh.
        runJob();
    }, [runJob]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={phase === "running" ? undefined : onClose}
        >
            <View style={styles.root}>
                <View style={styles.card}>
                    {phase === "running" && (
                        <>
                            <View style={styles.runningHeader}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.title}>Building your content calendar</Text>
                            </View>
                            <Text style={styles.subtitle}>
                                Our AI is turning your strategy into scheduled posts. This can take a
                                little while — hang tight.
                            </Text>

                            <ScrollView
                                ref={scrollRef}
                                style={styles.feed}
                                contentContainerStyle={styles.feedContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {steps.length === 0 ? (
                                    <Text style={styles.waiting}>Getting started…</Text>
                                ) : (
                                    steps.map((s, i) => {
                                        const isLast = i === steps.length - 1;
                                        return (
                                            <View key={s.id} style={styles.stepRow}>
                                                {isLast ? (
                                                    <ActivityIndicator
                                                        size="small"
                                                        color={colors.primary}
                                                        style={styles.stepIcon}
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon
                                                        icon={faCircleCheck}
                                                        size={14}
                                                        color={colors.toastSuccess}
                                                        style={styles.stepIcon}
                                                    />
                                                )}
                                                <Text
                                                    style={[
                                                        styles.stepText,
                                                        isLast && styles.stepTextActive,
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {s.message}
                                                </Text>
                                            </View>
                                        );
                                    })
                                )}
                            </ScrollView>
                        </>
                    )}

                    {phase === "success" && done && (
                        <View style={styles.centered}>
                            <View style={styles.successBadge}>
                                <FontAwesomeIcon
                                    icon={faCalendarCheck}
                                    size={30}
                                    color={colors.onPrimary}
                                />
                            </View>
                            <Text style={styles.title}>Your calendar is ready! 🎉</Text>
                            <Text style={styles.subtitle}>
                                {done.createdCount} {done.createdCount === 1 ? "post" : "posts"} scheduled
                                {"\n"}
                                {friendlyDate(done.startDate)} – {friendlyDate(done.endDate)}
                                {done.removedCount > 0
                                    ? `  ·  ${done.removedCount} replaced`
                                    : ""}
                            </Text>
                            <Pressable
                                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                                onPress={() => onViewCalendar(done.startDate)}
                            >
                                <FontAwesomeIcon
                                    icon={faCalendarCheck}
                                    size={14}
                                    color={colors.onPrimary}
                                />
                                <Text style={styles.primaryBtnText}>View content calendar</Text>
                            </Pressable>
                        </View>
                    )}

                    {phase === "error" && (
                        <View style={styles.centered}>
                            <View style={styles.errorBadge}>
                                <FontAwesomeIcon
                                    icon={faTriangleExclamation}
                                    size={26}
                                    color={colors.toastError}
                                />
                            </View>
                            <Text style={styles.title}>Couldn't build the calendar</Text>
                            <Text style={styles.subtitle}>{errorMsg}</Text>
                            <View style={styles.actions}>
                                <Pressable
                                    style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelBtnText}>Close</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.primaryBtn, styles.primaryBtnFlex, pressed && styles.pressed]}
                                    onPress={handleRetry}
                                >
                                    <Text style={styles.primaryBtnText}>Try again</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, safeAreaTop: number) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.backdrop,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: safeAreaTop,
            paddingHorizontal: 16,
        },
        card: {
            width: "100%",
            maxWidth: 460,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 16,
        },
        runningHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            textAlign: "center",
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 8,
            lineHeight: 19,
            textAlign: "center",
        },
        feed: {
            marginTop: 16,
            maxHeight: 220,
            backgroundColor: colors.tag,
            borderRadius: 12,
        },
        feedContent: {
            padding: 12,
            gap: 10,
        },
        waiting: {
            fontSize: 13,
            color: colors.textSecondary,
            fontStyle: "italic",
        },
        stepRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        stepIcon: {
            width: 18,
            alignItems: "center",
        },
        stepText: {
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        stepTextActive: {
            color: colors.text,
            fontWeight: "600",
        },
        centered: {
            alignItems: "center",
        },
        successBadge: {
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            marginBottom: 16,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.4,
            elevation: 6,
        },
        errorBadge: {
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.toastErrorBg,
            marginBottom: 16,
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 22,
            paddingVertical: 13,
            paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnFlex: {
            flex: 1.4,
            marginTop: 0,
        },
        primaryBtnText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
            marginTop: 22,
            alignSelf: "stretch",
        },
        cancelBtn: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 13,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        cancelBtnText: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.text,
        },
        pressed: {
            opacity: 0.75,
        },
    });
}

export default PushToCalendarProgressModal;
