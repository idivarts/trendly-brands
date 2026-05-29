import { ContentStrategy, ReviewStatus } from "@/components/content-strategy/types";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCalendarDays,
    faCheck,
    faPaperPlane,
    faRotateLeft,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

// ── Platform-specific editor (resolved once at module level) ──────────────────

const PlatformEditor: React.ComponentType<EditorProps> = Platform.select({
    native: () => require("./StrategyEditorPanelNative").default,
    default: () => require("./StrategyEditorPanelWeb").default,
})();

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorProps {
    content: string;
    onChange: (text: string) => void;
    onSendToChat: (text: string) => void;
    onSnippetComment?: (snippet: string, anchorStart: number, anchorEnd: number) => void;
    strategyId?: string;
}

export interface ToolbarProps {
    strategy: ContentStrategy;
    currentManagerId: string;
    xl: boolean;
    onApprove: () => void;
    onRequestChanges: () => void;
    onInvite: () => void;
    onSendForReview: () => void;
    onPushToCalendar: () => void;
}

export interface StrategyEditorPanelProps extends EditorProps {
    toolbar?: ToolbarProps;
}

// ── Review Status Toolbar ─────────────────────────────────────────────────────

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: "transparent", text: "transparent", label: "" },
    in_review: { bg: "rgba(224,122,0,0.1)", text: "#E07A00", label: "Pending Review" },
    approved: { bg: "rgba(26,122,58,0.1)", text: "#1A7A3A", label: "Approved" },
    changes_requested: { bg: "rgba(220,38,38,0.1)", text: "#DC2626", label: "Changes Requested" },
};

const StrategyToolbar: React.FC<ToolbarProps & { colors: ReturnType<typeof Colors> }> = ({
    strategy,
    currentManagerId,
    xl,
    onApprove,
    onRequestChanges,
    onInvite,
    onSendForReview,
    onPushToCalendar,
    colors,
}) => {
    const reviewStatus = strategy.reviewStatus ?? "draft";
    const config = REVIEW_STATUS_CONFIG[reviewStatus];
    const isDraft = reviewStatus === "draft";
    const isReviewer =
        reviewStatus === "in_review" &&
        strategy.collaboratorIds?.includes(currentManagerId) &&
        strategy.reviewRequestedBy !== currentManagerId;
    const canSendForReview = reviewStatus === "draft" || reviewStatus === "changes_requested";

    const styles = toolbarStyles(colors, xl, isDraft ? "transparent" : config.bg);

    return (
        <View style={styles.row}>
            {!isDraft && (
                <View style={styles.statusBlock}>
                    <Text style={[styles.statusLabel, { color: config.text }]}>{config.label}</Text>
                    {reviewStatus === "in_review" && (
                        <Text style={styles.statusSub}>
                            {isReviewer
                                ? "This strategy has been sent to you for review."
                                : "Awaiting review from collaborators."}
                        </Text>
                    )}
                </View>
            )}
            <View style={styles.actions}>
                {isReviewer && (
                    <>
                        <Pressable
                            style={({ pressed }) => [styles.approveBtn, pressed && styles.btnPressed]}
                            onPress={onApprove}
                            accessibilityLabel="Approve"
                        >
                            <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />
                            {xl && <Text style={styles.approveBtnText}>Approve</Text>}
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.rejectBtn, pressed && styles.btnPressed]}
                            onPress={onRequestChanges}
                            accessibilityLabel="Request Changes"
                        >
                            <FontAwesomeIcon icon={faRotateLeft} size={12} color="#DC2626" />
                            {xl && <Text style={styles.rejectBtnText}>Request Changes</Text>}
                        </Pressable>
                    </>
                )}

                <Pressable
                    style={({ pressed }) => [
                        xl ? styles.outlineBtn : styles.iconBtn,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={onInvite}
                    accessibilityLabel="Invite collaborators"
                >
                    <FontAwesomeIcon icon={faUserGroup} size={14} color={colors.primary} />
                    {xl && <Text style={styles.outlineBtnText}>Invite</Text>}
                </Pressable>

                {canSendForReview && (
                    <Pressable
                        style={({ pressed }) => [
                            xl ? styles.outlineBtn : styles.iconBtn,
                            pressed && styles.btnPressed,
                        ]}
                        onPress={onSendForReview}
                        accessibilityLabel="Send for Review"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.primary} />
                        {xl && <Text style={styles.outlineBtnText}>Send for Review</Text>}
                    </Pressable>
                )}

                <Pressable
                    style={({ pressed }) => [
                        xl ? styles.outlineBtn : styles.iconBtn,
                        pressed && styles.btnPressed,
                    ]}
                    onPress={onPushToCalendar}
                    accessibilityLabel="Push to Calendar"
                >
                    <FontAwesomeIcon icon={faCalendarDays} size={14} color={colors.primary} />
                    {xl && <Text style={styles.outlineBtnText}>Push to Calendar</Text>}
                </Pressable>
            </View>
        </View>
    );
};

function toolbarStyles(colors: ReturnType<typeof Colors>, xl: boolean, bg: string) {
    return StyleSheet.create({
        row: {
            backgroundColor: bg === "transparent" ? colors.background : bg,
            paddingHorizontal: xl ? 16 : 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        statusBlock: {
            flex: 1,
            minWidth: 0,
        },
        statusLabel: {
            fontSize: 13,
            fontWeight: "700",
        },
        statusSub: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: xl ? 8 : 6,
            marginLeft: "auto",
        },
        approveBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: xl ? 12 : 10,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: "#1A7A3A",
        },
        approveBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#fff",
        },
        rejectBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: xl ? 12 : 10,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: "rgba(220,38,38,0.12)",
        },
        rejectBtnText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#DC2626",
        },
        outlineBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        outlineBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.primary,
        },
        iconBtn: {
            width: 34,
            height: 34,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.primary,
        },
        btnPressed: {
            opacity: 0.72,
        },
    });
}

// ── StrategyEditorPanel ───────────────────────────────────────────────────────

const StrategyEditorPanel: React.FC<StrategyEditorPanelProps> = (props) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { toolbar, ...editorProps } = props;

    return (
        <View style={{ flex: 1 }}>
            {toolbar && <StrategyToolbar {...toolbar} colors={colors} />}
            <PlatformEditor {...editorProps} />
        </View>
    );
};

export default StrategyEditorPanel;
