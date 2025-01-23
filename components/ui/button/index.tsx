import {
  Button as RNPButton,
  ButtonProps as RNPButtonProps,
} from "react-native-paper";

interface ButtonProps extends RNPButtonProps {
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  contentStyle,
  style,
  size,
  ...props
}) => {
  return (
    <RNPButton
      mode="contained"
      style={[
        style,
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
