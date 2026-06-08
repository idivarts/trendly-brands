import Colors from "@/shared-uis/constants/Colors";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface OnboardingLoaderProps {
    /** Headline shown above the rotating status lines. */
    title?: string;
    /** Fun status lines cycled every ~1.8s while work runs behind the curtain. */
    messages?: string[];
}

const DEFAULT_MESSAGES = [
    "Setting up your brand…",
    "Reserving your workspace…",
    "Warming up the AI…",
    "Almost there…",
];

/**
 * Full-screen "fun" loader that doubles as the curtain for the awe-striking
 * 5 → 6 → 7 transition and the destination handoff: pulsing gradient rings, a
 * floating sparkle, and rotating status copy. Mounted while the brand/org is
 * created and again while a chosen destination is seeded, so the user never
 * sees a half-built screen.
 */
const OnboardingLoader: React.FC<OnboardingLoaderProps> = ({
    title = "Building your space",
    messages = DEFAULT_MESSAGES,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => useStyles(colors), [colors]);

    const [msgIndex, setMsgIndex] = useState(0);
    useEffect(() => {
        const id = setInterval(
            () => setMsgIndex((i) => (i + 1) % messages.length),
            1800
        );
        return () => clearInterval(id);
    }, [messages.length]);

    return (
        <LinearGradient
            colors={[colors.background, colors.aliceBlue, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.center}>
                {/* Pulsing rings */}
                <View style={styles.ringStack}>
                    {[0, 1, 2].map((i) => (
                        <MotiView
                            key={i}
                            style={[styles.ring]}
                            from={{ opacity: 0.5, scale: 0.6 }}
                            animate={{ opacity: 0, scale: 1.8 }}
                            transition={{
                                type: "timing",
                                duration: 2000,
                                loop: true,
                                delay: i * 600,
                            }}
                        />
                    ))}
                    <MotiView
                        style={styles.core}
                        from={{ scale: 0.9 }}
                        animate={{ scale: 1.08 }}
                        transition={{
                            type: "timing",
                            duration: 1000,
                            loop: true,
                        }}
                    >
                        <MotiView
                            from={{ rotate: "0deg" }}
                            animate={{ rotate: "360deg" }}
                            transition={{
                                type: "timing",
                                duration: 4000,
                                loop: true,
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faWandMagicSparkles}
                                size={30}
                                color={colors.onPrimary}
                            />
                        </MotiView>
                    </MotiView>
                </View>

                <Text style={styles.title}>{title}</Text>

                <MotiView
                    key={msgIndex}
                    style={styles.messageWrap}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 400 }}
                >
                    <Text style={styles.message}>{messages[msgIndex]}</Text>
                </MotiView>
            </View>
        </LinearGradient>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        },
        center: {
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
        },
        ringStack: {
            width: 160,
            height: 160,
            alignItems: "center",
            justifyContent: "center",
        },
        ring: {
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary,
        },
        core: {
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
            shadowOpacity: 0.45,
            elevation: 8,
        },
        title: {
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
            textAlign: "center",
        },
        messageWrap: {
            minHeight: 22,
            alignItems: "center",
            justifyContent: "center",
        },
        message: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
        },
    });
}

export default OnboardingLoader;
