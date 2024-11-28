import { Modal, Pressable } from "react-native";
import { Text, View } from "../theme/Themed";
import { Button } from "react-native-paper";
import { useTheme } from "@react-navigation/native";
import stylesFn from "@/styles/modal/AddModal.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

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
            <Pressable
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <FontAwesomeIcon
                icon={faClose}
                size={20}
                color={theme.colors.text}
              />
            </Pressable>
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
