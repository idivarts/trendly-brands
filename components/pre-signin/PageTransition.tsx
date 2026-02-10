import { LinearGradient } from 'expo-linear-gradient';
import gsap from 'gsap';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface PageTransitionRef {
    triggerTransition: (
        buttonPosition: { x: number; y: number; width: number; height: number },
        gradient: string[],
        onComplete: () => void
    ) => void;
}

const PageTransition = forwardRef<PageTransitionRef>((props, ref) => {
    const overlayRef = useRef<View>(null);
    const textContainerRef = useRef<View>(null);
    const textRef = useRef<Text>(null);
    const [gradientColors, setGradientColors] = useState(['#0F2027', '#203A43', '#2C5364']);

    useImperativeHandle(ref, () => ({
        triggerTransition: (buttonPosition, gradient, onComplete) => {
            if (Platform.OS !== 'web' || !overlayRef.current) {
                onComplete();
                return;
            }

            // Update gradient colors
            setGradientColors(gradient);

            const overlay = overlayRef.current as any;
            const textElement = textRef.current as any;
            const textContainer = textContainerRef.current as any;

            // Start from bottom center of screen
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight;
            const startSize = 100;

            // Calculate maximum distance to cover entire screen from bottom
            const maxDistance = Math.max(
                Math.sqrt(startX ** 2 + startY ** 2),
                Math.sqrt((window.innerWidth - startX) ** 2 + startY ** 2),
                Math.sqrt(startX ** 2 + (window.innerHeight - startY) ** 2),
                Math.sqrt((window.innerWidth - startX) ** 2 + (window.innerHeight - startY) ** 2)
            );

            const coverScreenScale = (maxDistance * 2.2) / startSize;
            const fullExpandScale = coverScreenScale * 1.5;

            // Set initial state - circular shape at bottom
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
            // Set initial text state
            gsap.set(textElement, {
                opacity: 0,
            });

            // Create timeline
            const tl = gsap.timeline();

            // 1. Expand circle to cover screen (curved expansion)
            tl.to(overlay, {
                scale: coverScreenScale,
                duration: 0.9,
                ease: 'power2.out',
            });

            // 2. Fade in text after circle starts expanding
            tl.to(textElement, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            }, '-=0.3');

            // 3. Hold with text visible and navigate
            tl.add(() => {
                onComplete(); // Navigate to new page
            }, '+=1.2');

            // 4. Fade out text
            tl.to(textElement, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in',
            }, '+=0.2');

            // 6. Expand further and fade out to reveal page underneath
            tl.to(overlay, {
                scale: fullExpandScale,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(overlay, { display: 'none' });
                },
            }, '-=0.2');
        },
    }));

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
});

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
        display: 'none',
        // opacity: 0,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    transitionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 2,
        zIndex: 10,
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
