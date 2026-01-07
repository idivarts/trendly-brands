import { useTheme } from "@react-navigation/native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from "expo-image-picker";
import { Modal, Platform, Pressable } from "react-native";

import { View } from "@/components/theme/Themed";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { faFolder, faImage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import Button from "../button";

interface DocumentUploadModalProps {
    onDocumentUpload: (url: string) => void;
    onImageUpload: (image: string) => void;
    onVideoUpload: (video: string) => void;
    setVisible: (visible: boolean) => void;
    visible: boolean;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
    onDocumentUpload,
    onImageUpload,
    onVideoUpload,
    setVisible,
    visible,
}) => {
    const theme = useTheme();
    const styles = stylesFn(theme);

    const openGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Media library access is required to select images, videos, or documents');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            if (result.assets[0].type === "video") {
                onVideoUpload(result.assets[0].uri);
                setVisible(false);
                return;
            }
            onImageUpload(result.assets[0].uri);
            setVisible(false);
        }
    }

    const openDocuments = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "*/*",
        });

        if (!result.canceled) {
            onDocumentUpload(result.assets[0].uri);
            setVisible(false);
        }
    }

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
                            onPress={openGallery}
                            style={styles.modalButton}
                        >
                            <FontAwesomeIcon
                                icon={faImage}
                                size={20}
                            />
                        </Pressable>
                        <Pressable
                            onPress={openDocuments}
                            style={styles.modalButton}
                        >
                            <FontAwesomeIcon
                                icon={faFolder}
                                size={20}
                            />
                        </Pressable>
                    </View>
                    <Button
                        mode="contained"
                        onPress={() => setVisible(false)}
                    >
                        Cancel
                    </Button>
                </View>
            </View>
        </Modal>
    );
};

export default DocumentUploadModal;
