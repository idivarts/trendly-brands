import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Linking } from "react-native";
import { Button } from "react-native-paper";
import InviteToCampaignModal from "./InviteToCampaignModal";

interface InviteButtonProps {
  label?: string;
  disabled?: boolean;
  openModal: (args: any) => void;
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
  label = "Invite",
  disabled,
  openModal,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Get selectedBrand directly from context
  const { selectedBrand } = useBrandContext();

  const handleInvitePress = () => {
    const credits = selectedBrand?.credits?.connection || 0;

    if (credits <= 0) {
      openModal({
        title: "No Connection Credit",
        description:
          "You seem to have exhausted the connection credit. Contact support for recharging the credit.",
        confirmText: "Contact Support",
        confirmAction: () => Linking.openURL("mailto:support@idiv.in"),
      });
      return;
    }

    setModalVisible(true);
  };

  const handleInviteConfirm = (selectedIds: string[]) => {
    console.log("✅ Inviting influencer to campaigns:", selectedIds);
    // TODO: backend integration
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
            borderRadius: 50,
            paddingHorizontal: 4,
            paddingVertical: 0,
            minHeight: 32,
            alignSelf: "flex-start",
          },
        ]}
        labelStyle={{
          color: Colors(theme).white,
          fontWeight: "400",
          textTransform: "none",
          fontSize: 14,
        }}
      >
        {label}
      </Button>

      {modalVisible && (
        <InviteToCampaignModal
          onClose={() => setModalVisible(false)}
          onInvite={handleInviteConfirm}
        />
      )}
    </>
  );
};

export default InviteToCampaignButton;
