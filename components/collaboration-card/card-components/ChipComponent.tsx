import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { FC } from "react";
import { Chip } from "react-native-paper";

interface ChipCardProps {
  chipText: string;
  chipIcon: IconProp;
}

const ChipCard: FC<ChipCardProps> = ({ chipText, chipIcon }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: Colors(theme).primary,
        padding: 5,
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        marginRight: 5,
        gap: 5,
      }}
    >
      <FontAwesomeIcon icon={chipIcon} size={20} color={Colors(theme).white} />
      <Text
        style={{
          color: Colors(theme).white,
          fontSize: 12,
          fontWeight: "bold",
        }}
      >
        {chipText}
      </Text>
    </View>
  );
};

export default ChipCard;
