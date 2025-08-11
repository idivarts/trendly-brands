import Colors from "@/constants/Colors";
import { useAuthContext, useAWSContext, useChatContext } from "@/contexts";
import { useBrandContext } from "@/contexts/brand-context.provider";
import AppLayout from "@/layouts/app-layout";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useMyNavigation } from "@/shared-libs/utils/router";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import ImageComponent from "@/shared-uis/components/image-component";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { faGears, faPen, faSignOut } from "@fortawesome/free-solid-svg-icons";
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
import ProfileItemCard from "../ProfileItemCard";
import Button from "../ui/button";
import ImageUploadModal from "../ui/modal/ImageUploadModal";
import ScreenHeader from "../ui/screen-header";
import TextInput from "../ui/text-input";

const Profile = () => {
  const router = useMyNavigation()
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
  const { signOutManager: signOut } = useAuthContext();
  const { deregisterTokens } = useChatContext();
  const { openModal } = useConfirmationModel();

  const handleSignOut = async () => {
    await deregisterTokens?.();
    await signOut();
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
          <View style={styles.sectionCard}>
            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              <ImageComponent
                url={capturedImage}
                size="medium"
                altText="Profile Image"
                shape="circle"
                initialsSize={40}
                initials={manager?.name}
                style={{ backgroundColor: Colors(theme).primary }}
              />
              <Pressable onPress={() => setIsModalVisible(true)} style={styles.editIcon}>
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
                disabled={loading}
              >
                Save Profile
              </Button>
            )}
          </View>
          <View style={styles.sectionDivider} />
          <View style={styles.middleRow}>
            <ProfileItemCard
              key={"settings-menu"}
              item={{
                id: "settings-menu",
                title: "Settings",
                href: "/settings",
                icon: faGears,
              }}
              onPress={() => {
                router.push('/settings');
              }}
            />
            <ProfileItemCard
              key={"logout"}
              item={{
                href: "/",
                icon: faSignOut,
                id: "logout",
                title: "Logout"
              }}
              onPress={() => {
                openModal({
                  title: "Logout",
                  description: "Are you sure you want to logout?",
                  confirmAction: handleSignOut,
                  confirmText: "Logout",
                });
              }}
            />
          </View>
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
    marginBottom: 12,
  },
  saveButton: {
    width: "100%",
    marginTop: 8,
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: 100,
  },
  brandAvatar: {
    bottom: 36,
    marginBottom: -72,
    left: 20,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors(theme).primary,
  },
  brandName: {
    fontSize: 24,
    textAlign: "center",
    color: Colors(theme).text,
  },
  menuItemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
    justifyContent: "space-between",
  },
  topRow: {
    gap: 20,
    alignItems: "center",
    paddingTop: 20,
  },
  middleRow: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    gap: 12,
  },
  bottomRow: {
    gap: 14,
  },
  menuRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors(theme).aliceBlue,
    paddingVertical: 14,
  },
  menuRowText: {
    fontSize: 16,
  },
  userProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors(theme).primary,
  },
  avatarBrandImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors(theme).primary,
    width: 200,
    height: 200,
    borderRadius: 20,
  },

  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
  },
  chevron: {
    backgroundColor: Colors(theme).background,
    color: Colors(theme).primary,
  },
  menuButton: {
    backgroundColor: Colors(theme).primary,
  },
  sectionCard: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: Colors(theme).card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    // subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors(theme).aliceBlue,
  },
  sectionDivider: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors(theme).aliceBlue,
    marginBottom: 20,
  },
});

export default Profile;
