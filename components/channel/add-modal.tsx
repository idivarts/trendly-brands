import { Modal } from "react-native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import { Button, IconButton } from "react-native-paper";
import { useTheme } from "@react-navigation/native";

interface AddModalProps {
  action: () => void;
  actionLabel: string;
  content: React.ReactNode;
  setVisible: (visible: boolean) => void;
  title: string;
  visible: boolean;
}

const AddModal: React.FC<AddModalProps> = ({
  action,
  actionLabel = "Add",
  content,
  setVisible,
  title,
  visible,
}) => {
  const theme = useTheme();

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onDismiss={() => setVisible(false)}
      transparent={true}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: Colors(theme).transparent,
          gap: 12,
        }}
      >
        <View
          style={{
            minHeight: 280,
            gap: 10,
            backgroundColor: Colors(theme).aliceBlue,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            padding: 10,
          }}
        >
          <View
            style={{
              backgroundColor: Colors(theme).transparent,
              position: "relative",
            }}
          >
            <Text
              style={{
                paddingTop: 15,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {title}
            </Text>
            <IconButton
              icon="close"
              onPress={() => setVisible(false)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
              }}
            />
          </View>
          <View
            style={{
              gap: 10,
              backgroundColor: Colors(theme).transparent,
            }}
          >
            {content}
          </View>
          <Button
            mode="contained"
            onPress={action}
          >
            {actionLabel}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default AddModal;
