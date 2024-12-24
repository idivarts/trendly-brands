import { Animated, StyleProp, ViewStyle } from "react-native";
import {
  Button as RNPButton,
  ButtonProps as RNPButtonProps,
} from "react-native-paper";

interface ButtonProps extends RNPButtonProps {
  customStyles?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  contentStyle,
  customStyles,
  size,
  ...props
}) => {
  return (
    <RNPButton
      mode="contained"
      style={[
        customStyles,
      ]}
      contentStyle={[
        size === 'small' && {
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        contentStyle,
      ]}
      labelStyle={[
        size === 'small' && {
          fontSize: 12,
        },
        size === 'medium' && {
          fontSize: 16,
        },
        size === 'large' && {
          fontSize: 20,
        },
      ]}
      {...props}
    />
  );
};

export default Button;
