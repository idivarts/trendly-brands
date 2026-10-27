/**
 * HandoffCard — the last card on Overview: who gets this next.
 *
 * It used to lead with "Write the script & timeline", which opened a modal.
 * The script is now a section of its own directly above this card, so the
 * button pointed at something already on screen — and a primary action that
 * duplicates the section above it reads as two different places to do one job.
 *
 * What remains is handing off: send it to a colleague for review, or post it
 * as a brief for creators. Both are peers now, and both leave the page, which
 * is why the card sits at the very bottom — after the work, not among it.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    faChevronRight,
    faHandshake,
    faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    /** Reel vs landscape video — only affects the copy's noun. */
    isReel: boolean;
    /** Omitted when the member lacks the capability — the row is then hidden. */
    onShare?: () => void;
    onCreateCollab?: () => void;
}

const HandoffCard: React.FC<Props> = ({
    isReel,
    onShare,
    onCreateCollab,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const noun = isReel ? "reel" : "video";

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
                <Text style={styles.title}>Hand it off</Text>
                <Text style={styles.sub}>
                    Send it to your team for review, or post it as a brief for creators to film.
                </Text>


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
