import React, { useEffect, useRef } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    Easing,
    cancelAnimation
} from "react-native-reanimated";
import gsap from "gsap";
import { useFocusEffect } from "expo-router";

interface InfiniteMarqueeProps {
    children: React.ReactNode;
    duration?: number;
    reverse?: boolean;
}

const InfiniteMarquee = ({ children, duration = 20000, reverse = false }: InfiniteMarqueeProps) => {
    // ---------------- Mobile Implementation (Reanimated) ----------------
    const translateX = useSharedValue(0);
    const containerWidth = 2000; // Approximate width of content to scroll

    useEffect(() => {
        if (Platform.OS !== 'web') {
            translateX.value = 0;
            translateX.value = withRepeat(
                withTiming(reverse ? containerWidth : -containerWidth, {
                    duration: duration,
                    easing: Easing.linear,
                }),
                -1, // Infinite repeat
                false // No reverse (loop continuously)
            );
        }
        return () => {
             cancelAnimation(translateX);
        };
    }, [reverse, duration]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    // ---------------- Web Implementation (GSAP) ----------------
    const marqueeRef = useRef<View>(null);
    const contentRef1 = useRef<View>(null);
    const contentRef2 = useRef<View>(null);

    useFocusEffect(
        React.useCallback(() => {
            let ctx: gsap.Context;
            
            if (Platform.OS === 'web') {
                ctx = gsap.context(() => {
                    const totalWidth = 2000; // Should ideally measure this
                    const targetX = reverse ? totalWidth : -totalWidth;
                    
                    gsap.to([contentRef1.current, contentRef2.current], {
                        x: targetX,
                        duration: duration / 1000,
                        ease: "none",
                        repeat: -1,
                    });
                }, marqueeRef);
            }

            return () => {
                ctx?.revert();
            };
        }, [duration, reverse])
    );

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, { overflow: 'hidden' }]} ref={marqueeRef}>
                <View style={[styles.contentContainer, { width: '200%' }]}>
                     {/* Duplicate content for seamless loop */}
                    <View ref={contentRef1} style={styles.contentChunk}>
                        {children}
                    </View>
                    <View ref={contentRef2} style={styles.contentChunk}>
                        {children}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { overflow: 'hidden' }]}>
            <Animated.View style={[styles.contentContainer, animatedStyle, { width: 4000 }]}>
                 {/* Triplicate content to ensure coverage during scroll */}
                <View style={styles.contentChunk}>{children}</View>
                <View style={styles.contentChunk}>{children}</View>
                <View style={styles.contentChunk}>{children}</View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    contentContainer: {
        flexDirection: 'row',
    },
    contentChunk: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});

export default InfiniteMarquee;
