import { Text, View } from "../theme/Themed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { Title } from "react-native-paper";

import stylesFn from "@/styles/modal/UploadModal.styles";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

interface ScreenThreeProps {
  type: "Add" | "Edit";
}

const ScreenThree: React.FC<ScreenThreeProps> = ({
  type,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <>
      <View style={styles.container3}>
        <FontAwesomeIcon
          icon={faCheckCircle}
          size={100}
          color={Colors(theme).primary}
          style={styles.checkIcon}
        />
        <Title style={styles.title}>
          Collaboration {type === "Add" ? "Posted" : "Updated"}
        </Title>
        <Text style={styles.description}>
          Your collaboration has been successfully {type === "Add" ? "posted" : "updated"}.
        </Text>
      </View>
    </>
  );
};

export default ScreenThree;
