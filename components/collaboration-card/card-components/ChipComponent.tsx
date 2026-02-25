import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { FC, useMemo } from "react";
import { StyleSheet } from "react-native";

interface ChipCardProps {
    chipText: string;
    chipIcon: IconProp;
}

const ChipCard: FC<ChipCardProps> = ({ chipText, chipIcon }) => {
    const theme = useTheme();
    const styles = useMemo(() => useStyles(theme), [theme]);

    return (
        <View style={styles.chip}>
            <FontAwesomeIcon icon={chipIcon} size={20} color={Colors(theme).white} />
            <Text style={styles.chipText}>
                {chipText}
            </Text>
        </View>
    );
};

function useStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        chip: {
            backgroundColor: Colors(theme).primary,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            alignItems: "center",
            flexDirection: "row",
            marginRight: 5,
            gap: 5,
        },
        chipText: {
            color: Colors(theme).white,
            fontSize: 12,
            fontWeight: "bold",
        },
    });
}

export default ChipCard;
