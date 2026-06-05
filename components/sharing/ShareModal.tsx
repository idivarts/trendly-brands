import { ShareTarget, useShareLink } from "@/hooks/use-share-link";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCheck,
    faCopy,
    faGlobe,
    faLink,
    faLock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ShareModalProps {
    visible: boolean;
    target: ShareTarget;
    /** Display name shown in the modal copy (strategy / content title, or month). */
    title: string;
    onClose: () => void;
}

const LABELS: Record<ShareTarget["type"], { noun: string; blurb: string }> = {
    strategy: {
        noun: "strategy",
        blurb: "Anyone with the link can view this strategy in read-only mode.",
    },
    content: {
        noun: "content",
        blurb: "Anyone with the link can view this content in read-only mode.",
    },
    calendarMonth: {
        noun: "month",
        blurb: "Anyone with the link can view this month's calendar in read-only mode.",
    },
};

const ShareModal: React.FC<ShareModalProps> = ({ visible, target, title, onClose }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);

    const { enabled, shareUrl, loading, mutating, enable, disable } = useShareLink(target);
    const [copied, setCopied] = useState(false);

    const label = LABELS[target.type];

    const handleToggle = async (next: boolean) => {
        try {
            if (next) {
                await enable();
                Toaster.success("Public link created");
            } else {
                await disable();
                Toaster.success("Public link disabled");
            }
        } catch {
            Toaster.error("Couldn't update sharing", "Please try again.");
        }
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await Clipboard.setStringAsync(shareUrl);
            setCopied(true);
            Toaster.success("Link copied to clipboard");
            setTimeout(() => setCopied(false), 3000);
        } catch {
            Toaster.error("Failed to copy link");
        }
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
                    <Pressable style={styles.card} onPress={() => {}}>
                        {/* ── Header ─────────────────────────────────────── */}
                        <View style={styles.headerRow}>
                            <View style={styles.headerIcon}>
                                <FontAwesomeIcon icon={faLink} size={16} color={colors.primary} />
                            </View>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.title}>Share {label.noun}</Text>
                                <Text style={styles.subtitle} numberOfLines={2}>
                                    {title}
                                </Text>
                            </View>
                        </View>

                        {/* ── Public toggle ──────────────────────────────── */}
                        <View style={styles.toggleCard}>
                            <View style={styles.toggleIcon}>
                                <FontAwesomeIcon
                                    icon={enabled ? faGlobe : faLock}
                                    size={15}
                                    color={enabled ? colors.primary : colors.textSecondary}
                                />
                            </View>
                            <View style={styles.toggleTextWrap}>
                                <Text style={styles.toggleTitle}>
                                    {enabled ? "Public link is on" : "Public link is off"}
                                </Text>
                                <Text style={styles.toggleHint}>{label.blurb}</Text>
                            </View>
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Switch
                                    value={enabled}
                                    onValueChange={handleToggle}
                                    disabled={mutating}
                                    trackColor={{ false: colors.tag, true: colors.primary }}
                                    thumbColor={colors.card}
                                />
                            )}
                        </View>

                        {/* ── Link + copy ───────────────────────────────── */}
                        {enabled && shareUrl && (
                            <View style={styles.linkRow}>
                                <Text style={styles.linkUrl} numberOfLines={1} ellipsizeMode="middle">
                                    {shareUrl}
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                                    onPress={handleCopy}
                                >
                                    <FontAwesomeIcon
                                        icon={copied ? faCheck : faCopy}
                                        size={13}
                                        color={colors.onPrimary}
                                    />
                                    <Text style={styles.copyBtnText}>{copied ? "Copied" : "Copy"}</Text>
                                </Pressable>
                            </View>
                        )}

                        {enabled && (
                            <Text style={styles.note}>
                                Viewers who aren't part of this brand see a read-only view. Signed-in
                                viewers can leave comments; logged-out viewers are prompted to sign in.
                            </Text>
                        )}

                        {/* ── Footer ────────────────────────────────────── */}
                        <View style={styles.actions}>
                            <Pressable
                                style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
                                onPress={onClose}
                            >
                                <Text style={styles.doneBtnText}>Done</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </View>
        </Modal>
    );
};

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
            maxWidth: 460,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 16,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        headerIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        headerTextWrap: {
            flex: 1,
            minWidth: 0,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        toggleCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.tag,
            marginTop: 18,
        },
        toggleIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        toggleTextWrap: {
            flex: 1,
            minWidth: 0,
        },
        toggleTitle: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        toggleHint: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
            lineHeight: 16,
        },
        linkRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 8,
            paddingLeft: 14,
            borderRadius: 12,
            backgroundColor: colors.tag,
            marginTop: 12,
        },
        linkUrl: {
            flex: 1,
            fontSize: 13,
            color: colors.text,
        },
        copyBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 9,
            paddingHorizontal: 14,
            borderRadius: 9,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        copyBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        note: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 17,
            marginTop: 12,
        },
        actions: {
            flexDirection: "row",
            marginTop: 18,
        },
        doneBtn: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        doneBtnText: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        pressed: {
            opacity: 0.75,
        },
    });
}

export default ShareModal;
