import { Modal, Platform, Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "react-native-paper";

import { View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCamera, faImage } from "@fortawesome/free-solid-svg-icons";

interface ImageUploadModalProps {
  onImageUpload: (image: string) => void;
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  onImageUpload,
  setVisible,
  visible,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('We need camera permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      onImageUpload(result.assets[0].uri);
      setVisible(false);
    }
  }

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('We need camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      onImageUpload(result.assets[0].uri);
      setVisible(false);
    }
  };

  const removeImage = () => {
    onImageUpload('');
    setVisible(false);
  };

  return (
    <Modal
      style={styles.modal}
      visible={visible}
      animationType={Platform.OS === "web" ? "fade" : "slide"}
      transparent={true}
    >
      <View
        style={styles.modalOverlay}
      >
        <View
          style={styles.uploadContainer}
        >
          <View
            style={styles.uploadInnerContainer}
          >
            <Pressable
              onPress={openCamera}
              style={styles.modalButton}
            >
              <FontAwesomeIcon
                icon={faCamera}
                size={20}
              />
            </Pressable>
            <Pressable
              onPress={openGallery}
              style={styles.modalButton}
            >
              <FontAwesomeIcon
                icon={faImage}
                size={20}
              />
            </Pressable>
          </View>
          <Button
            mode="contained"
            onPress={removeImage}
          >
            Cancel
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default ImageUploadModal;
