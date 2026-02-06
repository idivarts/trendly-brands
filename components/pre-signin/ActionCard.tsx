import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import gsap from "gsap";

interface ActionCardProps {
    title: string;
    description: string;
    colors: readonly [string, string, ...string[]];
    onPress: () => void;
}

const ActionCard = ({ title, description, colors, onPress }: ActionCardProps) => {
    const scale = useSharedValue(1);
    const cardRef = useRef<View>(null);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96); // Deeper press
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    // Web: 3D Wobble Effect
    const handleMouseMove = (e: any) => {
        if (Platform.OS === 'web' && cardRef.current) {
            // @ts-ignore
            const rect = e.target.getBoundingClientRect();
            const x = e.nativeEvent.clientX - rect.left; // x position within the element.
            const y = e.nativeEvent.clientY - rect.top;  // y position within the element.
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
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
            scale.value = withSpring(1);
            gsap.to(cardRef.current, {
                rotationX: 0,
                rotationY: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.5)",
            });
        }
    };

    const handleMouseEnter = () => {
        if (Platform.OS === 'web') scale.value = withSpring(1.02);
    };

    return (
        <Pressable 
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            // @ts-ignore: Web only props
            onHoverIn={handleMouseEnter}
            onHoverOut={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={styles.pressable}
        >
            <View ref={cardRef}>
                <Animated.View style={[styles.container, animatedStyle]}>
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
                            <Animated.View>
                                <MaterialCommunityIcons name="arrow-right" size={40} color="white" style={styles.icon} />
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    pressable: {
        width: '100%',
        marginVertical: 10,
        // @ts-ignore
        perspective: 1000, // Important for 3D effect
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
