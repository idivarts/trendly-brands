import { stylesFn } from "@/styles/tag/Tag.styles";
import { useTheme } from "@react-navigation/native";
import { Chip, ChipProps } from "react-native-paper";

const Tag: React.FC<ChipProps> = ({
    children,
    ...props
}) => {
    const theme = useTheme();
    const styles = stylesFn(theme);

    return (
        <Chip
            style={styles.tag}
            textStyle={styles.tagText}
            {...props}
        >
            {children}
        </Chip>
    );
};

export default Tag;
