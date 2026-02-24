import { ColorsStatic } from "@/shared-uis/constants/Colors";
import React from "react";
import { View, StyleSheet, ViewStyle, DimensionValue } from "react-native";

type CustomDividerProps = {
  thickness?: number;
  color?: string;
  length?: DimensionValue;
  orientation?: "horizontal" | "vertical";
  margin?: number;
  radius?: number;
  opacity?: number;
  dashed?: boolean;
  style?: ViewStyle;
};

const CustomDivider = ({
  thickness = 1,
  color = ColorsStatic.borderDivider,
  length = "100%",
  orientation = "horizontal",
  margin = 0,
  radius = 0,
  opacity = 1,
  dashed = false,
  style,
}: CustomDividerProps) => {
  const isHorizontal = orientation === "horizontal";

  return (
    <View
      style={[
        {
          backgroundColor: color,
          opacity,
          borderRadius: radius,
          marginVertical: isHorizontal ? margin : 0,
          marginHorizontal: !isHorizontal ? margin : 0,
          width: isHorizontal ? length : thickness,
          height: isHorizontal ? thickness : length,
          borderStyle: dashed ? "dashed" : "solid",
          borderWidth: dashed ? thickness : 0,
          borderColor: color,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});


export default CustomDivider;