import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowRight,
    faCheckCircle,
    faFileCirclePlus,
    faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EmptyCollaborationsViewProps {
    onCreateFromContent: () => void;
    onCreateDirectly: () => void;
}

const STEPS = [
    { step: 1, label: "Create Content", sub: "Script, caption, or visual asset" },
    { step: 2, label: "Get Approved", sub: "Review and finalize the content" },
    { step: 3, label: "Post Collab", sub: "Launch the collaboration request" },
];

const EmptyCollaborationsView: React.FC<EmptyCollaborationsViewProps> = ({
    onCreateFromContent,
    onCreateDirectly,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <View style={styles.ghostList} pointerEvents="none">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.ghostRow}>
                        <View style={[styles.ghostAccent, { height: 48 + i * 6 }]} />
                        <View style={styles.ghostBody}>
                            <View style={styles.ghostTopRow}>
                                <View style={[styles.ghostChip, { width: 52 + i * 6 }]} />
                                <View style={[styles.ghostBadge, { width: 58 + i * 4 }]} />
                            </View>
                            <View style={[styles.ghostBar, { width: `${50 + i * 9}%` }]} />
                            <View style={[styles.ghostBar, { width: `${30 + i * 7}%`, opacity: 0.5 }]} />
                            <View style={styles.ghostFooter}>
                                <View style={[styles.ghostBar, { width: 80, height: 8 }]} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <FontAwesomeIcon icon={faHandshake} size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>No collaborations yet</Text>
                    <Text style={styles.subtitle}>
                        For best results, create content first — then turn approved pieces into collaboration posts.
                    </Text>

                    <View style={styles.stepsRow}>
                        {STEPS.map((s, i) => (
                            <View key={s.step} style={styles.stepItem}>
                                <View style={[styles.stepCircle, i === 2 && styles.stepCircleActive]}>
                                    <Text style={[styles.stepNum, i === 2 && styles.stepNumActive]}>
                                        {s.step}
                                    </Text>
                                </View>
                                <Text style={[styles.stepLabel, i === 2 && styles.stepLabelActive]}>
                                    {s.label}
                                </Text>
                                <Text style={styles.stepSub}>{s.sub}</Text>
                                {i < STEPS.length - 1 && (
                                    <View style={styles.stepArrow}>
                                        <FontAwesomeIcon
                                            icon={faArrowRight}
                                            size={10}
                                            color={colors.textSecondary}
                                        />
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={styles.ctaRow}>
                        <Pressable
                            style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
                            onPress={onCreateFromContent}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} size={14} color={colors.primary} />
                            <Text style={styles.ctaSecondaryText}>From Approved Content</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
                            onPress={onCreateDirectly}
                        >
                            <FontAwesomeIcon icon={faFileCirclePlus} size={14} color={colors.onPrimary} />
                            <Text style={styles.ctaPrimaryText}>Create Directly</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    position: "relative",
                },
                ghostList: {
                    ...StyleSheet.absoluteFillObject,
                    padding: 16,
                    gap: 10,
                    opacity: 0.1,
                },
                ghostRow: {
                    flexDirection: "row",
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                ghostAccent: {
                    width: 4,
                    backgroundColor: colors.primary,
                },
                ghostBody: {
                    flex: 1,
                    padding: 14,
                    gap: 6,
                },
                ghostTopRow: {
                    flexDirection: "row",
                    gap: 8,
                },
                ghostChip: {
                    height: 20,
                    borderRadius: 6,
                    backgroundColor: colors.tag,
                },
                ghostBadge: {
                    height: 20,
                    borderRadius: 6,
                    backgroundColor: colors.tag,
                },
                ghostBar: {
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.tag,
                },
                ghostFooter: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 2,
                },
                overlay: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                card: {
                    width: "100%",
                    maxWidth: 520,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 28,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 24,
                    shadowOpacity: 0.1,
                    elevation: 8,
                },
                iconWrap: {
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.aliceBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.15,
                    elevation: 3,
                },
                title: {
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 8,
                },
                subtitle: {
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 19,
                    marginBottom: 20,
                },
                stepsRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    gap: 0,
                    marginBottom: 24,
                    width: "100%",
                },
                stepItem: {
                    flex: 1,
                    alignItems: "center",
                    position: "relative",
                    paddingHorizontal: 4,
                },
                stepArrow: {
                    position: "absolute",
                    right: -6,
                    top: 10,
                },
                stepCircle: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.tag,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                },
                stepCircleActive: {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    shadowOpacity: 0.3,
                    elevation: 3,
                },
                stepNum: {
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.textSecondary,
                },
                stepNumActive: {
                    color: colors.onPrimary,
                },
                stepLabel: {
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 2,
                },
                stepLabelActive: {
                    color: colors.primary,
                },
                stepSub: {
                    fontSize: 10,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 14,
                    opacity: 0.7,
                },
                ctaRow: {
                    flexDirection: "row",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    width: "100%",
                },
                ctaPrimary: {
                    flex: 1,
                    minWidth: 130,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    shadowOpacity: 0.35,
                    elevation: 4,
                },
                ctaPrimaryText: {
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.onPrimary,
                },
                ctaSecondary: {
                    flex: 1,
                    minWidth: 130,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    backgroundColor: colors.aliceBlue,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                ctaSecondaryText: {
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.primary,
                },
                ctaPressed: {
                    opacity: 0.72,
                },
            }),
        [colors]
    );
}

export default EmptyCollaborationsView;
