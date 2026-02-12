import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import gsap from "gsap";
import React, { useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

interface ActionCardProps {
    title: string;
    description: string;
    colors: readonly [string, string, ...string[]];
    onPress: () => void;
    onPressWithAnimation?: (buttonLayout: { x: number; y: number; width: number; height: number }, colors: readonly [string, string, ...string[]]) => void;
}

const ActionCard = ({ title, description, colors, onPress, onPressWithAnimation }: ActionCardProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const cardRef = useRef<View>(null);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();

        // Execute the callback after a short delay
        setTimeout(() => {
            // If custom animation callback is provided, measure button and call it
            if (onPressWithAnimation && cardRef.current) {
                cardRef.current.measure((x, y, width, height, pageX, pageY) => {
                    onPressWithAnimation({ x: pageX, y: pageY, width, height }, colors);
                });
            } else {
                onPress();
            }
        }, 0);
    };

    // Web: 3D Wobble Effect
    const handleMouseMove = (e: any) => {
        if (Platform.OS === 'web' && cardRef.current) {
            // @ts-ignore
            const rect = e.target.getBoundingClientRect();
            const x = e.nativeEvent.clientX - rect.left;
            const y = e.nativeEvent.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            gsap.to(cardRef.current, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.4,
                ease: "power2.out",
                transformPerspective: 1000,
            });
        }
    };

    const handleMouseLeave = () => {
        if (Platform.OS === 'web' && cardRef.current) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }).start();
            gsap.to(cardRef.current, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.5)",
            });
        }
    };

    const handleMouseEnter = () => {
        if (Platform.OS === 'web') {
            Animated.spring(scaleAnim, {
                toValue: 1.02,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }).start();
        }
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            // @ts-ignore: Web only props
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={styles.pressable}
        >
            <View ref={cardRef}>
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <View style={styles.content}>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{title}</Text>
                                <Text style={styles.description}>{description}</Text>
                            </View>
                            <View>
                                <MaterialCommunityIcons name="arrow-right" size={40} color="white" style={styles.icon} />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    pressable: {
        width: '100%',
        marginVertical: 10,
        // @ts-ignore
        perspective: '1000px', // Important for 3D effect
    },
    container: {
        width: '100%',
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    gradient: {
        padding: 32,
        borderRadius: 24,
        minHeight: 180,
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        paddingRight: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
        marginBottom: 8,
        lineHeight: 38,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 24,
    },
    icon: {
        opacity: 0.9,
    }
});

export default ActionCard;
