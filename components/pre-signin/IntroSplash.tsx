import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/lottie/hi-brands.json")}
        autoPlay
        loop={false}
        onAnimationFinish={onComplete}
        style={{ width: 320, height: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    zIndex: 9999,
  },
});