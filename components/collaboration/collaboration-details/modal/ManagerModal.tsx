import { Image, Pressable, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Text, View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { Chip, Modal } from "react-native-paper";
import Colors from "@/constants/Colors";

interface ManagerModalProps {
  managerName: string;
  managerEmail: string;
  brandDescription: string;
  managerImage: string;
  visible: boolean;
  setVisibility: (visible: boolean) => void;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
  managerName,
  managerEmail,
  brandDescription,
  managerImage,
  visible,
  setVisibility,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <Modal
      visible={visible}
      onDismiss={() => setVisibility(false)}
      contentContainerStyle={{
        backgroundColor: Colors(theme).background,
        borderRadius: 10,
        padding: 20,
        marginHorizontal: 20,
      }}
    >
      <View style={{ alignItems: "center", gap: 20 }}>
        {/* Brand Image */}
        <Image
          source={{ uri: managerImage }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 240,
          }}
        />

        {/* Brand Name */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: Colors(theme).text,
            textAlign: "center",
          }}
        >
          {managerName}
        </Text>

        {/* Brand Description */}
        <Text
          style={{
            fontSize: 16,
            color: Colors(theme).text,
            textAlign: "center",
          }}
        >
          {brandDescription}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: Colors(theme).text,
            }}
          >
            Email: {managerEmail}
          </Text>
        </View>

        {/* Brand Website */}
      </View>
    </Modal>
  );
};

export default ManagerModal;
