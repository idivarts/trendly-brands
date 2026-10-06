/**
 * HandoffCard — the bottom-of-page "what next" card for reel/video content.
 *
 * Replaces a reel-only banner that offered a single action (post this as a
 * collab requirement) and, separately, an inline script card wedged above the
 * caption. The three things a brand does once the concept exists now sit
 * together, in the order they actually happen: write the shot list, send it to a
 * colleague, or hand it to creators.
 *
 * They are NOT three peer buttons. Writing the script is authoring — frequent,
 * private, reversible, and it keeps the user on the page — so it leads as the
 * primary action and carries its own state. Sharing is occasional. Posting a
 * collab requirement is rare, consequential and navigates away, so it is the
 * quietest row despite having been the loudest before.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    faChevronRight,
    faFilm,
    faHandshake,
    faPenToSquare,
    faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { scriptStateLabel } from "./script-stats";

interface Props {
    /** Reel vs landscape video — only affects the copy's noun. */
    isReel: boolean;
    /** Current script, used to show whether a draft exists. */
    script: string;
    onOpenScript: () => void;
    /** Omitted when the member lacks the capability — the row is then hidden. */
    onShare?: () => void;
    onCreateCollab?: () => void;
    /** Scheduled/posted content: the script is viewable but not editable. */
    readOnly?: boolean;
}

const HandoffCard: React.FC<Props> = ({
    isReel,
    script,
    onOpenScript,
    onShare,
    onCreateCollab,
    readOnly = false,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const noun = isReel ? "reel" : "video";
    const scriptState = scriptStateLabel(script);

    const SecondaryRow: React.FC<{
        icon: IconDefinition;
        label: string;
        sub: string;
        onPress: () => void;
    }> = ({ icon, label, sub, onPress }) => (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}. ${sub}`}
        >
            <View style={styles.rowIcon}>
                <FontAwesomeIcon icon={icon} size={14} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowSub}>{sub}</Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={13} color={colors.textSecondary} />
        </Pressable>
    );

    return (
        <View style={styles.card}>
            <View style={styles.accent} />
            <View style={styles.body}>
                <Text style={styles.title}>Plan the shoot, then hand it off</Text>
                <Text style={styles.sub}>
                    Write the shot-by-shot timeline, send it to your team for review, or post it as a
                    brief for creators to film.
                </Text>

                {/* Primary — authoring. Carries its own state so the user can see
                    at a glance whether a script exists, which the old collapsible
                    card communicated by auto-expanding. */}
                <Pressable
                    style={({ pressed }) => [styles.primaryRow, pressed && styles.pressed]}
                    onPress={onOpenScript}
                    accessibilityRole="button"
                    accessibilityLabel={
                        readOnly
                            ? `View the script and timeline. ${scriptState}`
                            : `Write the script and timeline. ${scriptState}`
                    }
                >
                    <View style={styles.primaryIcon}>
                        <FontAwesomeIcon
                            icon={readOnly ? faFilm : faPenToSquare}
                            size={15}
                            color={colors.onPrimary}
                        />
                    </View>
                    <View style={styles.rowText}>
                        <Text style={styles.primaryLabel}>
                            {readOnly ? "View the script & timeline" : "Write the script & timeline"}
                        </Text>
                        <Text style={styles.primarySub}>{scriptState}</Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={13} color={colors.onPrimary} />
                </Pressable>

                {onShare ? (
                    <SecondaryRow
                        icon={faShareNodes}
                        label="Share with your team"
                        sub="Send a link for review or approval"
                        onPress={onShare}
                    />
                ) : null}

                {onCreateCollab ? (
                    <SecondaryRow
                        icon={faHandshake}
                        label={`Find creators to film it`}
                        sub={`Post as a collab requirement — creators discover this ${noun} and apply`}
                        onPress={onCreateCollab}
                    />
                ) : null}
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        card: {
            flexDirection: "row",
            backgroundColor: colors.card,
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 12,
            shadowOpacity: 0.1,
            elevation: 4,
        },
        // Accent stripe as a sibling View, never borderLeftWidth.
        accent: {
            width: 4,
            backgroundColor: colors.primary,
        },
        body: {
            flex: 1,
            padding: 16,
            gap: 10,
        },
        title: {
            fontSize: fs(15),
            fontWeight: "700",
            color: colors.text,
        },
        sub: {
            fontSize: fs(13),
            lineHeight: lh(19),
            color: colors.textSecondary,
        },

        primaryRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minHeight: 60,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryIcon: {
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backdropStrong,
        },
        primaryLabel: {
            fontSize: fs(14),
            fontWeight: "800",
            color: colors.onPrimary,
        },
        primarySub: {
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.onPrimary,
            opacity: 0.85,
        },

        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minHeight: 56,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        rowIcon: {
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        rowText: {
            flex: 1,
            gap: 2,
        },
        rowLabel: {
            fontSize: fs(14),
            fontWeight: "700",
            color: colors.text,
        },
        rowSub: {
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.textSecondary,
        },
        pressed: {
            opacity: 0.72,
        },
    });
}

export default HandoffCard;
