import Colors from "@/constants/Colors";
import { useAuthContext, useAWSContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Theme, useTheme } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../theme/Themed";
import Button from "../ui/button";
import ImageUploadModal from "../ui/modal/ImageUploadModal";
import ScreenHeader from "../ui/screen-header";
import TextInput from "../ui/text-input";

const Profile = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false); // Loader state
  const { manager } = useAuthContext();
  const { selectedBrand } = useBrandContext();
  const [capturedImage, setCapturedImage] = useState<string>(
    manager?.profileImage || ""
  );
  const [imageToUpload, setImageToUpload] = useState<string>("");
  const { uploadFileUri } = useAWSContext();

  const theme = useTheme();
  const styles = stylesFn(theme);

  const updateProfile = async () => {
    if (!manager || !manager.id) {
      Console.error("Manager ID is missing");
      return;
    }

    const managerRef = doc(FirestoreDB, "managers", manager.id);

    setLoading(true);
    try {
      let updatedImageURL = manager.profileImage || ""; // Default to existing profile image

      if (imageToUpload) {
        if (Platform.OS === "web") {
          Toaster.error("Web upload not supported yet");
          return;
        } else {
          const res = await uploadFileUri({
            id: manager.id,
            localUri: imageToUpload,
            uri: imageToUpload,
            type: "image",
          })
          if (res) {
            updatedImageURL = res.imageUrl || "";
          }
        }
      }

      // Update Firestore document
      await updateDoc(managerRef, {
        profileImage: updatedImageURL,
        name: name || manager.name,
      });
      if (selectedBrand) {
        const brandMemberRef = doc(
          FirestoreDB,
          "brands",
          selectedBrand.id,
          "members",
          manager.id
        );
        await updateDoc(brandMemberRef, {
          role,
        });
      }

      setImageToUpload(""); // Clear image-to-upload buffer
      Toaster.success("Profile updated successfully");
      fetchRole();
    } catch (error) {
      Console.error(error, "Error during profile update");
      Toaster.error("Error during profile update");
    } finally {
      setLoading(false);
    }
  };

  const fetchRole = async () => {
    if (selectedBrand && selectedBrand.id && manager && manager.id) {
      const managerRef = doc(
        FirestoreDB,
        "brands",
        selectedBrand.id,
        "members",
        manager.id
      );
      const managerData = await getDoc(managerRef);
      if (managerData.exists()) {
        setRole(managerData.data().role);
      }
    }
  };

  useEffect(() => {
    if (!manager) {
      Console.error("Manager object is null");
      return;
    }
    setName(manager.name || ""); // Fallback to empty string
    fetchRole();
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
            <Pressable
              onPress={updateProfile}
            >
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
      <AppLayout>
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
            <ImageComponent
              url={capturedImage}
              size="medium"
              altText="Profile Image"
              shape="circle"
              initialsSize={40}
              initials={manager?.name}
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
                color={theme.dark ? Colors(theme).white : Colors(theme).primary}
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
            onChangeText={(text) => setRole(text)}
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
      </AppLayout>
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

const stylesFn = (theme: Theme) => StyleSheet.create({
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  editIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    backgroundColor: theme.dark ? Colors(theme).card : Colors(theme).tag,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.dark ? Colors(theme).white : Colors(theme).primary,
  },
  input: {
    width: "100%",
    marginBottom: 16,
  },
  saveButton: {
    width: "100%",
    marginTop: 16,
  },
});

export default Profile;
