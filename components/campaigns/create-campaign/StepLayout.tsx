import { Text, View } from "@/components/theme/Themed";
import { useBreakpoints } from "@/hooks";
import Colors from "@/shared-uis/constants/Colors";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

const TOTAL_STEPS = 5;

interface StepLayoutProps {
    children: React.ReactNode;
    step: number;
    title: string;
    subtitle?: string;
    onBack: () => void;
}

const StepLayout: React.FC<StepLayoutProps> = ({
    children,
    step,
    title,
    subtitle,
    onBack,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { xl } = useBreakpoints();
    const styles = useMemo(() => useStyles(colors, xl), [colors, xl]);

    const handleBack = () => {
        if (step === 1) {
            router.back();
        } else {
            onBack();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.root}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
                    <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.text} />
                </Pressable>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressRow}>
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.progressSegment,
                            { backgroundColor: step > i ? colors.primary : colors.aliceBlue },
                        ]}
                    />
                ))}
            </View>

            {/* Step label */}
            <Text style={styles.stepLabel}>
                Step {step} of {TOTAL_STEPS}
            </Text>

            {/* Content */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const useStyles = (colors: ReturnType<typeof Colors>, xl: boolean) =>
    StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            backgroundColor: colors.background,
        },
        backButton: {
            padding: 8,
            marginRight: 8,
        },
        headerText: {
            flex: 1,
            backgroundColor: "transparent",
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
        },
        headerSubtitle: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        progressRow: {
            flexDirection: "row",
            paddingHorizontal: 16,
            gap: 6,
            backgroundColor: "transparent",
        },
        progressSegment: {
            flex: 1,
            height: 4,
            borderRadius: 2,
        },
        stepLabel: {
            fontSize: 11,
            color: colors.textSecondary,
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 2,
        },
        scroll: {
            flex: 1,
        },
        scrollContent: {
            padding: 16,
            paddingBottom: 40,
            gap: 24,
            alignSelf: "center",
            width: "100%",
            maxWidth: xl ? 800 : undefined,
        },
    });

export default StepLayout;
