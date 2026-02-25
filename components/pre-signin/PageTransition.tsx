import { LinearGradient } from 'expo-linear-gradient';
import gsap from 'gsap';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { getConstrainedHeight, getConstrainedWidth } from '@/shared-libs/contexts/mobile-layout-context.provider';

export interface PageTransitionRef {
    triggerTransition: (
        buttonPosition: { x: number; y: number; width: number; height: number },
        gradient: string[],
        onComplete: () => void
    ) => void;
}

const SCREEN_WIDTH = getConstrainedWidth();
const SCREEN_HEIGHT = getConstrainedHeight();

const PageTransition = forwardRef<PageTransitionRef>((props, ref) => {
    const overlayRef = useRef<View>(null);
    const textContainerRef = useRef<View>(null);
    const textRef = useRef<Text>(null);
    const [gradientColors, setGradientColors] = useState(['#0F2027', '#203A43', '#2C5364']);
    const [isAnimating, setIsAnimating] = useState(false);

    // Mobile animation values
    const scale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        triggerTransition: (buttonPosition, gradient, onComplete) => {
            // Update gradient colors
            setGradientColors(gradient);

            if (Platform.OS === 'web' && overlayRef.current) {
                // Web animation using GSAP
                const overlay = overlayRef.current as any;
                const textElement = textRef.current as any;
                const textContainer = textContainerRef.current as any;

                const startX = window.innerWidth / 2;
                const startY = window.innerHeight;
                const startSize = 100;

                const maxDistance = Math.max(
                    Math.sqrt(startX ** 2 + startY ** 2),
                    Math.sqrt((window.innerWidth - startX) ** 2 + startY ** 2),
                    Math.sqrt(startX ** 2 + (window.innerHeight - startY) ** 2),
                    Math.sqrt((window.innerWidth - startX) ** 2 + (window.innerHeight - startY) ** 2)
                );

                const coverScreenScale = (maxDistance * 2.2) / startSize;

                gsap.set(overlay, {
                    display: 'flex',
                    opacity: 1,
                    scale: 0,
                    x: startX,
                    y: startY,
                    width: startSize,
                    height: startSize,
                    borderRadius: '50%',
                    xPercent: -50,
                    yPercent: -50,
                });

                gsap.set(textContainer, {
                    display: 'flex',
                });

                gsap.set(textElement, {
                    opacity: 0,
                });

                const tl = gsap.timeline();

                tl.to(overlay, {
                    scale: coverScreenScale,
                    duration: 0.45,
                    ease: 'power2.out',
                });

                tl.to(textElement, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                }, '-=0.15');

                tl.add(() => {
                    onComplete();
                }, '+=0.6');

                tl.to(textElement, {
                    opacity: 0,
                    duration: 0.25,
                    ease: 'power2.in',
                }, '+=0.1');

                tl.to(overlay, {
                    scale: 0,
                    duration: 0.45,
                    ease: 'power3.in',
                    onComplete: () => {
                        gsap.set(overlay, { display: 'none' });
                        gsap.set(textContainer, { display: 'none' });
                    },
                }, '-=0.05');
            } else {
                // Mobile animation using Reanimated
                const maxDimension = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
                // From a 100px circle to cover full screen (diagonal distance)
                const diagonal = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2);
                const coverScreenScale = diagonal / 100;

                // Show the overlay component
                setIsAnimating(true);

                // Show overlay immediately with full opacity
                overlayOpacity.value = 1;
                scale.value = 1; // Start visible
                textOpacity.value = 0;

                // Small delay to ensure component renders before animating
                setTimeout(() => {
                    // Expand animation, hold, then collapse smoothly
                    scale.value = withSequence(
                        // Expand to cover screen
                        withTiming(coverScreenScale, {
                            duration: 450,
                            easing: Easing.out(Easing.quad),
                        }),
                        // Hold at full size
                        withDelay(250, withTiming(coverScreenScale, { duration: 0 })),
                        // Collapse back to small circle
                        withTiming(1, {
                            duration: 350,
                            easing: Easing.in(Easing.quad),
                        }),
                        // Shrink to nothing
                        withTiming(0, {
                            duration: 150,
                            easing: Easing.in(Easing.cubic),
                        })
                    );

                    // Text fade in and out
                    textOpacity.value = withSequence(
                        // Fade in
                        withDelay(
                            150,
                            withTiming(1, {
                                duration: 300,
                                easing: Easing.out(Easing.quad),
                            })
                        ),
                        // Hold visible
                        withDelay(300, withTiming(1, { duration: 0 })),
                        // Fade out
                        withTiming(0, {
                            duration: 200,
                            easing: Easing.in(Easing.quad),
                        })
                    );
                }, 50);

                // Navigate while screen is fully covered
                setTimeout(() => {
                    onComplete();
                }, 700);

                // Final fade out
                overlayOpacity.value = withDelay(
                    1350,
                    withTiming(0, {
                        duration: 100,
                    })
                );

                // Hide overlay component after animation completes
                setTimeout(() => {
                    setIsAnimating(false);
                }, 1500);
            }
        },
    }));

    // Mobile animated styles
    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const circleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    if (Platform.OS === 'web') {
        return (
            <>
                <View
                    ref={overlayRef}
                    style={styles.overlay}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={gradientColors as any}
                        style={StyleSheet.absoluteFillObject}
                    />
                </View>

                <View
                    ref={textContainerRef}
                    style={styles.textContainer}
                    pointerEvents="none"
                >
                    <Text
                        ref={textRef}
                        style={styles.transitionText}
                    >
                        Get Started...
                    </Text>
                </View>
            </>
        );
    }

    // Mobile version
    return (
        <>
            {isAnimating && (
                <Animated.View
                    style={[styles.mobileOverlay, overlayAnimatedStyle]}
                    pointerEvents="none"
                >
                    <Animated.View
                        style={[
                            {
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                overflow: 'hidden',
                            },
                            circleAnimatedStyle,
                        ]}
                    >
                        <LinearGradient
                            colors={gradientColors as any}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </Animated.View>
                    <Animated.Text
                        style={[
                            styles.transitionText,
                            textAnimatedStyle,
                            {
                                position: 'absolute',
                            }
                        ]}
                    >
                        Get Started...
                    </Animated.Text>
                </Animated.View>
            )}
        </>
    );
});

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    mobileOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 999, // For Android
    },
    transitionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 2,
        zIndex: 100000,
    },
    textContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        display: 'none',
    },
});

export default PageTransition;
