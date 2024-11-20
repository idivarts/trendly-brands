import { stylesFn } from "@/styles/tag/Tag.styles";
import { Theme, useTheme } from "@react-navigation/native";
import { Chip, ChipProps } from "react-native-paper";

const Tag: React.FC<ChipProps> = ({
  icon,
  children,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <Chip
      icon={icon}
      style={styles.tag}
      textStyle={styles.tagText}
    >
      {children}
    </Chip>
  );
};

export default Tag;
