/**
 * ComingSoonPanel — what an approach tab shows before that approach is built.
 *
 * The tab itself stays live and selectable. A greyed-out tab reads as broken
 * and teaches nothing; a tab you can open, read and react to sets the
 * expectation AND tells us who wants it. So the panel replaces the composer
 * body — prompt, tray and strip all go — because showing controls that cannot
 * be submitted is worse than showing none.
 *
 * The button is not decoration. The tap is the cheapest signal we have about
 * which unbuilt approach to build first, and `had_prompt` separates someone who
 * idly opened the tab from someone who had already typed what they wanted to
 * make and hit a wall. Those two are not the same person.
 */
import { fs, lh } from "@/constants/Typography";
import Colors from "@/shared-uis/constants/Colors";
import { track } from "@/shared-libs/utils/analytics";
import { withAlpha } from "@/utils/color";
import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApproachSpec, ComingSoon } from "./approach-spec";

interface Props {
    approach: ApproachSpec;
    /**
     * What to say. Defaults to the approach's own copy; passed in when the
     * approach IS built and something else is in the way — AI video with no
     * model enabled for the workspace reads exactly like a feature that has not
     * shipped, from where the user sits, and the interest signal is as useful.
     */
    comingSoon?: ComingSoon;
    /** Whether the user had already typed a prompt before landing here. */
    hadPrompt: boolean;
}

const ComingSoonPanel: React.FC<Props> = ({ approach, comingSoon, hadPrompt }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [registered, setRegistered] = useState(false);

    const soon = comingSoon ?? approach.comingSoon;
    if (!soon) return null;

    const register = () => {
        if (registered) return;
        track("content_approach_interest", {
            approach: approach.id,
            had_prompt: hadPrompt,
        });
        setRegistered(true);
    };

    return (
        <View style={styles.panel}>
            <Text style={styles.promo}>{soon.promo}</Text>
            <Text style={styles.supporting}>{soon.supporting}</Text>

            {registered ? (
                <View style={styles.done}>
                    <FontAwesomeIcon icon={faCheck} size={13} color={colors.primary} />
                    <Text style={styles.doneText}>
                        Noted — we'll let you know when it's ready.
                    </Text>
                </View>
            ) : (
                <Pressable
                    style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                    onPress={register}
                    accessibilityRole="button"
                    accessibilityLabel={`Tell me when ${approach.title} is ready`}
                >
                    <FontAwesomeIcon icon={faBell} size={13} color={colors.primary} />
                    <Text style={styles.ctaText}>Tell me when this is ready</Text>
                </Pressable>
            )}

            <Text style={styles.hint}>
                Pick another approach above to make this {approach.kind === "video" ? "video" : "image"} now.
            </Text>
        </View>
    );
};

const useStyles = (colors: any) =>
    React.useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    paddingVertical: 18,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    // The raised surface: this panel stands where the prompt
                    // card stands, on the composer's recessed well.
                    backgroundColor: colors.card,
                    gap: 6,
                },
                promo: {
                    fontSize: fs(14),
                    lineHeight: lh(20),
                    fontWeight: "600",
                    color: colors.text,
                },
                supporting: {
                    fontSize: fs(12),
                    lineHeight: lh(18),
                    color: colors.textSecondary,
                },
                cta: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: 7,
                    marginTop: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 13,
                    borderRadius: 9,
                    backgroundColor: withAlpha(colors.primary, 0.12),
                },
                ctaText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.primary,
                },
                done: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    marginTop: 8,
                },
                doneText: {
                    fontSize: fs(12),
                    lineHeight: lh(16),
                    fontWeight: "600",
                    color: colors.primary,
                },
                hint: {
                    fontSize: fs(11),
                    lineHeight: lh(15),
                    color: colors.textSecondary,
                    marginTop: 4,
                },
                pressed: {
                    opacity: 0.75,
                },
            }),
        [colors]
    );

export default ComingSoonPanel;
