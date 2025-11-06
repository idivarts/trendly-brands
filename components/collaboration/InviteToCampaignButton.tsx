import React, { useCallback } from "react";
import { Linking, TouchableOpacity, Text } from "react-native";
import { Theme, useTheme } from '@react-navigation/native'
import Colors from "@/constants/Colors";


interface InviteButtonProps {
  label?: string;
  disabled?: boolean;
  style?: any;
}

interface InviteButtonProps {
  label?: string;
  disabled?: boolean;
  style?: any;
  openModal: (args: any) => void;
  selectedBrand: any;
  textstyle?: any;
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
  label = "Invite",
  disabled,
  style,
  openModal,
  selectedBrand,
  textstyle,
}) => {
        const theme = useTheme()
  const handleInvite = () => {
    console.log("Invite button pressed ✅");
    if ((selectedBrand?.credits?.connection || 0) <= 0) {
      openModal({
        title: "No Connection Credit",
        description:
          "You seem to have exhausted the connection credit. Contact support for recharging the credit.",
        confirmText: "Contact Support",
        confirmAction: () => Linking.openURL("mailto:support@idiv.in"),
      });
      return;
    }

    openModal({
      title: "Feature is Underway",
      description:
        "We are working on this feature. Please contact support to know more about it and the expected timeline.",
      confirmText: "Contact Support",
      confirmAction: () => Linking.openURL("mailto:support@idiv.in"),
    });
  };

  return (
    <TouchableOpacity
      onPress={handleInvite}
      disabled={disabled}
      style={[
        {
          backgroundColor: disabled ? "#ccc" : Colors(theme).primary,
          paddingVertical: 4,
          borderRadius: 12,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={[{ color: "#fff", fontWeight: "600" }, textstyle]}>{label}</Text>
    </TouchableOpacity>
  );
};
export default InviteToCampaignButton;
