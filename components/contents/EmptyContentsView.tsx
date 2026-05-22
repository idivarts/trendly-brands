import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowRight,
    faFileLines,
    faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EmptyContentsViewProps {
    onGoToStrategy: () => void;
    onCreateContent: () => void;
}

const STEPS = [
    { step: 1, label: "Create Strategy", sub: "Define your brand voice and goals" },
    { step: 2, label: "Plan Calendar", sub: "Schedule posts by date and format" },
    { step: 3, label: "Create Content", sub: "Write scripts, captions, and visuals" },
];

const EmptyContentsView: React.FC<EmptyContentsViewProps> = ({
    onGoToStrategy,
    onCreateContent,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <View style={styles.ghostList} pointerEvents="none">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.ghostRow}>
                        <View style={[styles.ghostChip, { width: 48 + i * 8 }]} />
                        <View style={styles.ghostLine}>
                            <View style={[styles.ghostBar, { width: `${55 + i * 8}%` }]} />
                            <View style={[styles.ghostBar, { width: `${35 + i * 5}%`, opacity: 0.5 }]} />
                        </View>
                        <View style={[styles.ghostBadge, { width: 60 + i * 4 }]} />
                    </View>
                ))}
            </View>

            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <FontAwesomeIcon icon={faFileLines} size={30} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>No content yet</Text>
                    <Text style={styles.subtitle}>
                        For best results, follow the recommended workflow before creating content:
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
                            onPress={onGoToStrategy}
                        >
                            <FontAwesomeIcon icon={faLayerGroup} size={14} color={colors.primary} />
                            <Text style={styles.ctaSecondaryText}>Go to Strategy</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
                            onPress={onCreateContent}
                        >
                            <Text style={styles.ctaPrimaryText}>Create Content</Text>
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
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 14,
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 6,
                    shadowOpacity: 0.06,
                    elevation: 2,
                },
                ghostChip: {
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: colors.tag,
                },
                ghostLine: {
                    flex: 1,
                    gap: 6,
                },
                ghostBar: {
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.tag,
                },
                ghostBadge: {
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.tag,
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
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    alignItems: "center",
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

export default EmptyContentsView;
