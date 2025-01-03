import React from "react";
import { Button, Chip, Modal, TextInput } from "react-native-paper";
import { stylesFn } from "@/styles/Members";
import { useTheme } from "@react-navigation/native";
import { View, Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import axios from "axios";
import { useAuthContext } from "@/contexts";
import { AuthApp } from "@/utils/auth";

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
  const { selectedBrand } = useBrandContext();

  const addMember = async () => {
    if (!selectedBrand) return;
    if (!email) {
      Toaster.error("Please enter email");
    }
    const user = await AuthApp.currentUser?.getIdToken();
    await axios
      .post(
        "https://be.trendly.pro/api/v1/brands/members",
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
      .then((res) => {
        Toaster.success("User Invited Successfully");
        refresh();
        handleModalClose();
      })
      .catch((e) => {
        Toaster.error("Something wrong happened");
        console.error(e);
      });
  };

  return (
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
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={(value) => setEmail(value)}
            style={styles.input}
            autoFocus
          />

          <Button mode="contained" onPress={addMember} style={styles.addButton}>
            Add Member
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default MembersModal;
