import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import gsap from "gsap";
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSequence, 
    withTiming, 
    withRepeat, 
    withDelay, 
    Easing, 
    runOnJS,
    SharedValue
} from "react-native-reanimated";

interface IntroSplashProps {
    onComplete: () => void;
}

const IntroSplash = ({ onComplete }: IntroSplashProps) => {
    const theme = useTheme();
    const brandColors = Colors(theme); // Keep for reference if needed
    const containerRef = useRef<View>(null);
    const elementsRef = useRef<View[]>([]);

    // Native Shared Values
    const opacity1 = useSharedValue(0);
    const scale1 = useSharedValue(0);
    const shake1 = useSharedValue(0);

    const opacity2 = useSharedValue(0);
    const scale2 = useSharedValue(0);
    const shake2 = useSharedValue(0);

    const opacity3 = useSharedValue(0);
    const scale3 = useSharedValue(0);
    const shake3 = useSharedValue(0);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const ctx = gsap.context(() => {
                const targets = elementsRef.current;
                
                // Initialize state (hide all)
                gsap.set(targets, { opacity: 0, scale: 0 });

                const glitchEase = "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false })";

                const animateGlitch = (target: any) => {
                    const tl = gsap.timeline();
                    
                    tl.fromTo(target, 
                        { scale: 0, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.2, ease: "rough({ strength: 2, points: 10 })" }
                    )
                    .to(target, {
                        x: 5, y: -5,
                        rotation: 2,
                        duration: 0.1,
                        repeat: 8,
                        yoyo: true,
                        ease: glitchEase 
                    })
                     .to(target, {
                        opacity: 0.8,
                        scale: 1.1,
                        duration: 0.05,
                        repeat: 5,
                        yoyo: true,
                    }, "<")
                    .to(target, { scale: 3, opacity: 0, duration: 0.2, ease: "power4.in" });
                    
                    return tl;
                };

                const master = gsap.timeline({
                     onComplete: () => {
                        setTimeout(onComplete, 200);
                    }
                });

                if (targets[0]) master.add(animateGlitch(targets[0]));
                if (targets[1]) master.add(animateGlitch(targets[1]), "+=0.1");
                if (targets[2]) master.add(animateGlitch(targets[2]), "+=0.1");

            }, containerRef);
            return () => ctx.revert();
        } else {
            // NATIVE ANIMATION SEQUENCE
            const GLITCH_DURATION = 800;
            
            // Helper for Shake
            const triggerShake = (shakeVal: SharedValue<number>) => {
                 shakeVal.value = withRepeat(
                    withSequence(
                        withTiming(5, { duration: 50 }),
                        withTiming(-5, { duration: 50 }),
                    ), 6, true 
                );
            };

            const animateStep = (
                opacity: SharedValue<number>, 
                scale: SharedValue<number>, 
                shake: SharedValue<number>, 
                delay: number
            ) => {
                // Reveal
                opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
                scale.value = withDelay(delay, withSequence(
                    withTiming(1, { duration: 200, easing: Easing.elastic(1.5) }), // Pop in
                    withTiming(1.2, { duration: GLITCH_DURATION }), // Glitch hold
                    withTiming(3, { duration: 200 }) // Explode
                ));
                
                // Shake
                setTimeout(() => triggerShake(shake), delay + 200);

                // Hide
                opacity.value = withDelay(delay + GLITCH_DURATION + 200, withTiming(0, { duration: 200 }));
            };

            // Sequence
            animateStep(opacity1, scale1, shake1, 0);
            animateStep(opacity2, scale2, shake2, 1200);
            animateStep(opacity3, scale3, shake3, 2400);

            // Complete
            setTimeout(() => {
                runOnJS(onComplete)();
            }, 3600);
        }
    }, []);

    // Native Animated Styles
    const style1 = useAnimatedStyle(() => ({
        opacity: opacity1.value,
        transform: [{ scale: scale1.value }, { translateX: shake1.value }, { translateY: -shake1.value }]
    }));
    const style2 = useAnimatedStyle(() => ({
        opacity: opacity2.value,
        transform: [{ scale: scale2.value }, { translateX: shake2.value }, { translateY: shake2.value }]
    }));
    const style3 = useAnimatedStyle(() => ({
        opacity: opacity3.value,
        transform: [{ scale: scale3.value }, { translateX: shake3.value }, { translateY: shake3.value }]
    }));

    return (
        <View ref={containerRef} style={[styles.container, { backgroundColor: '#ffffff' }]}>
            {/* Scanlines Overlay */}
            <View style={styles.scanlines} pointerEvents="none" />
            
            {/* 1. Instagram */}
            <Animated.View 
                ref={Platform.OS === 'web' ? (el: any) => elementsRef.current[0] = el : undefined}
                style={[styles.glitchContainer, styles.absCenter, Platform.OS !== 'web' ? style1 : { opacity: 0 }]}
            >
                <Text style={[styles.glitchLayer, { color: 'red', left: -2, opacity: 0.7 }]}>
                    <MaterialCommunityIcons name="instagram" size={120} />
                </Text>
                <Text style={[styles.glitchLayer, { color: 'blue', left: 2, opacity: 0.7 }]}>
                    <MaterialCommunityIcons name="instagram" size={120} />
                </Text>
                <View style={styles.mainLayer}>
                    <MaterialCommunityIcons name="instagram" size={120} color="black" />
                </View>
            </Animated.View>
            
            {/* 2. LinkedIn */}
            <Animated.View 
                ref={Platform.OS === 'web' ? (el: any) => elementsRef.current[1] = el : undefined}
                style={[styles.glitchContainer, styles.absCenter, Platform.OS !== 'web' ? style2 : { opacity: 0 }]}
            >
                    <Text style={[styles.glitchLayer, { color: 'red', top: -2, opacity: 0.7 }]}>
                    <MaterialCommunityIcons name="linkedin" size={120} />
                </Text>
                    <Text style={[styles.glitchLayer, { color: 'blue', top: 2, opacity: 0.7 }]}>
                    <MaterialCommunityIcons name="linkedin" size={120} />
                </Text>
                <View style={styles.mainLayer}>
                    <MaterialCommunityIcons name="linkedin" size={120} color="black" />
                </View>
            </Animated.View>

            {/* 3. Trendly */}
            <Animated.View 
                ref={Platform.OS === 'web' ? (el: any) => elementsRef.current[2] = el : undefined}
                style={[styles.glitchContainer, styles.absCenter, Platform.OS !== 'web' ? style3 : { opacity: 0 }]}
            >
                    <Text style={[styles.glitchLayer, { color: 'red', left: -3, opacity: 0.7 }, styles.trendlyText]}>
                    TRENDLY
                </Text>
                    <Text style={[styles.glitchLayer, { color: 'blue', left: 3, opacity: 0.7 }, styles.trendlyText]}>
                    TRENDLY
                </Text>
                <View style={styles.mainLayer}>
                        <Text style={[styles.trendlyText, { color: 'black' }]}>TRENDLY</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        overflow: 'hidden',
    },
    absCenter: {
        position: 'absolute',
        // Centering handled by parent justify/align
    },
    scanlines: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        backgroundImage: Platform.OS === 'web' ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))' : undefined,
        backgroundSize: '100% 4px, 6px 100%',
        zIndex: 10,
    },
    glitchContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glitchLayer: {
        position: 'absolute',
        zIndex: 1,
    },
    mainLayer: {
        zIndex: 2,
    },
    trendlyText: {
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: -2,
    }
});

export default IntroSplash;
