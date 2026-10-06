/**
 * MediaLaneCards — the Media Stage's empty state.
 *
 * Three peer cards (two for video, which has no photoreal generation) that each
 * start one creation lane. Deliberately equal weight: picking a lane is a real
 * choice, not a primary action with a consolation link underneath. Once a lane
 * is picked the others disappear until the media is cleared.
 */
import { ContentType } from "@/components/content-calendar/types";
import { fs, lh } from "@/constants/Typography";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpFromBracket,
    faImages,
    faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MediaLane, lanesFor } from "./media-lane";
import { MEDIA_SPEC } from "./media-spec";

interface Props {
    contentType: ContentType;
    onPick: (lane: MediaLane) => void;
}

interface CardCopy {
    icon: IconDefinition;
    title: string;
    sub: string;
}

function copyFor(lane: MediaLane, contentType: ContentType): CardCopy {
    const spec = MEDIA_SPEC[contentType];
    const noun = spec.multi ? "slides" : spec.kind === "video" ? "video" : "image";

    switch (lane) {
        case "design":
            return {
                icon: faWandMagicSparkles,
                title: "Design with AI",
                sub: spec.multi
                    ? "An editable, on-brand set of slides — tell the AI what you want."
                    : `An editable, on-brand ${noun} — tell the AI what you want.`,
            };
        case "generate":
            return {
                icon: faImages,
                title: spec.multi ? "Generate images" : "Generate an image",
                sub: "Describe a photo and the AI creates it from scratch.",
            };
        case "upload":
            return {
                icon: faArrowUpFromBracket,
                title: spec.multi ? "Upload your slides" : `Upload your own ${noun}`,
                sub: `Use ${spec.multi ? "slides" : `a ${noun}`} you've already made.`,
            };
    }
}

const MediaLaneCards: React.FC<Props> = ({ contentType, onPick }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const lanes = lanesFor(contentType);
    const styles = useStyles(colors, xl);

    return (
        <View style={styles.row}>
            {lanes.map((lane) => {
                const { icon, title, sub } = copyFor(lane, contentType);
                return (
                    <Pressable
                        key={lane}
                        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                        onPress={() => onPick(lane)}
                        accessibilityRole="button"
                        accessibilityLabel={title}
                    >
                        <View style={styles.iconBadge}>
                            <FontAwesomeIcon icon={icon} size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.sub}>{sub}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>, xl: boolean) {
    return StyleSheet.create({
        row: {
            flexDirection: xl ? "row" : "column",
            gap: 12,
        },
        card: {
            flex: xl ? 1 : undefined,
            gap: 8,
            padding: 16,
            borderRadius: 14,
            // A distinct surface on top of the Media Stage's own card, lifted with
            // a shadow rather than outlined.
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        pressed: {
            opacity: 0.85,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 5,
        },
        iconBadge: {
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card,
        },
        title: {
            fontSize: fs(14),
            fontWeight: "800",
            color: colors.text,
        },
        sub: {
            fontSize: fs(12),
            lineHeight: lh(17),
            color: colors.textSecondary,
        },
    });
}

export default MediaLaneCards;
