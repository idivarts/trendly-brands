import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { stylesFn } from "@/styles/Members";
import { AuthApp } from "@/utils/auth";
import { FirestoreDB } from "@/utils/firestore";
import axios from "axios";
import { doc, setDoc } from "firebase/firestore";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Modal, Portal } from "react-native-paper";
import Button from "../button";
import TextInput from "../text-input";

interface MembersModalProps {
  visible: boolean;
  handleModalClose: () => void;
  theme: any;
  refresh: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  handleModalClose,
  theme,
  refresh,
}) => {
  const styles = stylesFn(theme);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { selectedBrand } = useBrandContext();

  const addMember = async () => {
    if (!selectedBrand) return;
    if (!email || !name) {
      Toaster.error("Please enter all fields");
      return;
    }
    const user = await AuthApp.currentUser?.getIdToken();
    setLoading(true);

    await axios
      .post(
        "https://be.trendly.now/api/v1/brands/members",
        {
          brandId: selectedBrand.id,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${user}`,
          },
        }
      )
      .then(async (res) => {
        Toaster.success("User Invited Successfully");
        if (res.status === 200) {
          try {
            const userID = res.data.user.rawId;
            const memberRef = doc(FirestoreDB, "managers", userID);
            let userData = {
              name: name,
              email: email,
              pushNotificationToken: {
                ios: [],
                android: [],
                web: [],
              },
              settings: {
                theme: "light",
                emailNotification: true,
                pushNotification: true,
              },
            };
            await setDoc(memberRef, userData);
          } catch (e) {
            console.error(e);
            Toaster.error("Something wrong happened");
          }
        }
        refresh();
        handleModalClose();
      })
      .catch((e) => {
        Toaster.error("Something wrong happened");
        console.error(e);
      })
      .finally(() => {
        setEmail("");
        setName("");
        setLoading(false);
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            handleModalClose();
          }}
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add Member</Text>
            <Text style={styles.subtitle}>You can add members from here</Text>
            <View style={styles.modalInputContainer}>
              <ScrollView
                style={{
                  borderRadius: 10,
                  backgroundColor: Colors(theme).background,
                  gap: 12,
                }}
                contentContainerStyle={{
                  paddingBottom: 16,
                }}
              >
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={email}
                  onChangeText={(value) => setEmail(value)}
                  style={styles.input}
                  autoFocus
                />
                <TextInput
                  label="Name"
                  mode="outlined"
                  value={name}
                  onChangeText={(value) => setName(value)}
                  style={styles.input}
                />

                <Button
                  mode="contained"
                  onPress={addMember}
                  style={styles.addButton}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : "Add Member"}
                </Button>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

export default MembersModal;
