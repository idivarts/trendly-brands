import { Modal } from "react-native";
import { Text, View } from "../theme/Themed";
import { Button, IconButton } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import stylesFn from "@/styles/modal/AddModal.styles";

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
  const styles = stylesFn(theme);

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onDismiss={() => setVisible(false)}
      transparent={true}
      style={styles.modal}
    >
      <View
        style={styles.modalContainer}
      >
        <View
          style={styles.modalContent}
        >
          <View
            style={styles.modalTitleContainer}
          >
            <Text
              style={styles.modalTitle}
            >
              {title}
            </Text>
            <IconButton
              icon="close"
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            />
          </View>
          <View
            style={styles.modalInputContainer}
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
