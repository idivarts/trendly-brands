import React, { useState } from "react";
import { Linking, StyleProp, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Button } from "react-native-paper";
import Colors from "@/constants/Colors";
import InviteToCampaignModal from "./InviteToCampaignModal";

interface InviteButtonProps {
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textstyle?: StyleProp<TextStyle>;
  selectedBrand: any;
  openModal: (args: any) => void;
  collaborations?: {
    id: string;
    name: string;
    description: string;
    mediaUrl?: string;
    isVideo?: boolean;
    active?: boolean;
  }[];
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
  label = "Invite",
  disabled,
  style,
  textstyle,
  selectedBrand,
  openModal,
  collaborations = [],
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleInvitePress = () => {
    const credits = selectedBrand?.credits?.connection || 0;

    if (credits > 0) {
      openModal({
        title: "No Connection Credit",
        description:
          "You seem to have exhausted the connection credit. Contact support for recharging the credit.",
        confirmText: "Contact Support",
        confirmAction: () => Linking.openURL("mailto:support@idiv.in"),
      });
      return;
    }

    // ✅ Show your custom campaign modal now
    setModalVisible(true);
  };

  const handleInviteConfirm = (selectedIds: string[]) => {
    console.log("✅ Inviting influencer to campaigns:", selectedIds);
    // TODO: call your backend API here
    setModalVisible(false);
  };

  return (
    <>
      <Button
        mode="contained"
        onPress={handleInvitePress}
        disabled={disabled}
        style={[
          {
            backgroundColor: disabled
              ? Colors(theme).card
              : Colors(theme).primary,
            borderRadius: 12,
          },
          style,
        ]}
        labelStyle={[
          {
            color: Colors(theme).white,
            fontWeight: "600",
            textTransform: "none",
          },
          textstyle,
        ]}
      >
        {label}
      </Button>

      {/* ✅ Custom campaign invite modal */}
      <InviteToCampaignModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        collaborations={collaborations.filter((c) => c.active)}
        onInvite={handleInviteConfirm}
      />
    </>
  );
};

export default InviteToCampaignButton;
