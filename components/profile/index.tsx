import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button, Avatar } from "react-native-paper";
import { doc, updateDoc } from "firebase/firestore";
import Colors from "@/constants/Colors";
import { PLACEHOLDER_PERSON_IMAGE } from "@/constants/Placeholder";
import { useAuthContext, useFirebaseStorageContext } from "@/contexts";
import { useTheme } from "@react-navigation/native";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import ImageUploadModal from "../ui/modal/ImageUploadModal";
import { FirestoreDB } from "@/utils/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import ScreenHeader from "../ui/screen-header";
import { Text } from "../theme/Themed";
import {
  ref,
  uploadString,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";
import { StorageApp } from "@/utils/firebase-storage";

const Profile = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false); // Loader state
  const { manager } = useAuthContext();
  const [capturedImage, setCapturedImage] = useState<string>(
    manager?.profileImage || ""
  );
  const [imageToUpload, setImageToUpload] = useState<string>("");

  const theme = useTheme();

  const updateProfile = async () => {
    if (!manager || !manager.id) {
      console.error("Manager ID is missing");
      return;
    }

    const managerRef = doc(FirestoreDB, "managers", manager.id);

    setLoading(true);
    try {
      let updatedImageURL = manager.profileImage; // Default to existing profile image

      if (imageToUpload) {
        const path = `managers/${manager.id}/profile-image`;

        // Validate Base64 format

        const storageRef = ref(StorageApp, path);
        const blobImage = await fetch(imageToUpload).then((res) => res.blob());
        await uploadBytes(storageRef, blobImage);

        // // Get the downloadable URL for the uploaded image
        updatedImageURL = await getDownloadURL(storageRef);
      }

      // Update Firestore document
      await updateDoc(managerRef, {
        profileImage: updatedImageURL,
        name: name || manager.name,
      });

      setImageToUpload(""); // Clear image-to-upload buffer
      Toaster.success("Profile updated successfully");
    } catch (error) {
      console.error("Error during profile update:", error);
      Toaster.error("Error during profile update");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!manager) {
      console.error("Manager object is null");
      return;
    }
    setName(manager.name || ""); // Fallback to empty string
    setRole("Manager");
    setEmail(manager.email || ""); // Fallback to empty string
  }, [manager]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{}}>
        <ScreenHeader
          title="Profile"
          rightAction
          rightActionButton={
            <Pressable onPress={updateProfile}>
              <Text
                style={{
                  color: Colors(theme).text,
                  fontSize: 16,
                  marginRight: 16,
                }}
              >
                Save
              </Text>
            </Pressable>
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          alignItems: "center",
          backgroundColor: Colors(theme).background,
        }}
      >
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <Avatar.Image
            source={
              capturedImage
                ? {
                    uri: capturedImage,
                  }
                : require("@/assets/images/placeholder-person-image.png")
            }
            size={200}
            style={{
              backgroundColor: Colors(theme).primary,
            }}
          />
          <Pressable
            onPress={() => setIsModalVisible(true)}
            style={styles.editIcon}
          >
            <FontAwesomeIcon
              icon={faPen}
              color={Colors(theme).text}
              size={22}
            />
          </Pressable>
        </View>

        {/* Name Input */}
        <TextInput
          label="Name"
          value={name}
          onChangeText={(text) => setName(text)}
          mode="outlined"
          style={styles.input}
        />

        {/* Email (Static) */}
        <TextInput
          label="Email"
          value={email}
          mode="outlined"
          style={styles.input}
          editable={false}
        />

        {/* Role Input */}
        <TextInput
          label="Role"
          value={role}
          mode="outlined"
          style={styles.input}
          editable={false}
        />

        {/* Save Profile Button */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors(theme).primary} />
        ) : (
          <Button
            mode="contained"
            style={styles.saveButton}
            onPress={updateProfile}
            disabled={loading} // Disable button while loading
          >
            Save Profile
          </Button>
        )}
      </ScrollView>
      <ImageUploadModal
        setVisible={setIsModalVisible}
        visible={isModalVisible}
        onImageUpload={(image) => {
          if (!image) return;
          setCapturedImage(image);
          setImageToUpload(image);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  editIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  input: {
    width: "100%",
    marginBottom: 16,
  },
  saveButton: {
    width: "100%",
    paddingVertical: 4,
    marginTop: 16,
  },
});

export default Profile;
