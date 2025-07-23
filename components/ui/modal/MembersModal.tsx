import { Text, View } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { stylesFn } from "@/styles/Members";
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toaster.error("Please enter a valid email address");
      return;
    }

    if (name.trim().length < 3) {
      Toaster.error("Name must be at least 3 characters long");
      return;
    }
    const user = await AuthApp.currentUser?.getIdToken();
    setLoading(true);

    await HttpWrapper.fetch("/api/v2/brands/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brandId: selectedBrand.id,
        email,
        name
      })
    }).then(async (res) => {
      const data = await res.json()
      Toaster.success("User Invited Successfully");
      refresh();
    }).catch((e) => {
      Toaster.error("Something wrong happened");
      Console.error(e);
    }).finally(() => {
      handleModalClose();
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
                  inputMode="email"
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
