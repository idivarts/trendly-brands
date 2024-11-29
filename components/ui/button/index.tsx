import { Animated, StyleProp, ViewStyle } from "react-native";
import {
  Button as RNPButton,
  ButtonProps as RNPButtonProps,
} from "react-native-paper";

interface ButtonProps extends RNPButtonProps {
  customStyles?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
}

const Button: React.FC<ButtonProps> = ({
  customStyles,
  ...props
}) => {
  return (
    <RNPButton
      mode="contained"
      style={[
        customStyles,
      ]}
      {...props}
    />
  );
};

export default Button;
