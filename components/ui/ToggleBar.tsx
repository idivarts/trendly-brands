import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface Option {
  key: string;
  label: string;
}

interface ToggleBarProps {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export default function ToggleBar({ options, value, onChange, style }: ToggleBarProps) {
  const theme = useTheme();
  const colors = Colors(theme);
  const anim = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const index = Math.max(0, options.findIndex((o) => o.key === value));
    const toValue = width ? (index * width) / options.length : 0;
    Animated.timing(anim, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value, width, options.length, anim]);

  return (
    <View
      style={[{ height: 40, borderRadius: 12, overflow: "hidden" }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* sliding background */}
      <Animated.View
        style={{
          position: "absolute",
          height: "100%",
          width: `${100 / options.length}%`,
          backgroundColor: colors.primary,
          transform: [{ translateX: anim }],
          borderRadius: 12,
        }}
      />

      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt.key === value;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.8}
              style={styles.cell}
              onPress={() => onChange(opt.key)}
            >
              <Text style={{ color: selected ? colors.white : colors.text, fontWeight: "600" }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", height: "100%" },
  cell: { flex: 1, justifyContent: "center", alignItems: "center" },
});
