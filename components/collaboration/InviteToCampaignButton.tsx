import Colors from "@/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Linking } from "react-native";
import { Button } from "react-native-paper";
import Toast from "react-native-toast-message";
import InviteToCampaignModal from "./InviteToCampaignModal";

interface InviteButtonProps {
  label?: string;
  disabled?: boolean;
  openModal: (args: any) => void;
  influencerIds?: string[];
  influencerName?: string;
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
  label = "Invite",
  disabled,
  openModal,
  influencerIds,
  influencerName,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);

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

  const handleInviteConfirm = async (selectedIds: string[]) => {
    console.log("Inviting influencer to campaigns:", selectedIds);

    const brandId = selectedBrand?.id;

    if (!brandId) {
      openModal({
        title: "No Brand Selected",
        description: "Please select a brand to invite influencers.",
        confirmText: "Ok",
      });
      return;
    }

    const influencers = influencerIds || [];

    if (influencers.length === 0) {
      openModal({
        title: "No Influencer Selected",
        description: "Please select atleast one influencer to invite.",
        confirmText: "Ok",
      });
      return;
    }

    const payload = {
      influencers: influencers,
      collaborations: selectedIds || [],
    };
    console.log("Invite payload:", payload);

    if (loadingInvite) return; // avoid duplicates
    setLoadingInvite(true);

    try {
      await HttpWrapper.fetch(
        `/discovery/brands/${brandId}/influencers/invite`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        }
      );
      // Close modal and show success
      setModalVisible(false);
      if (openModal) {
        openModal({
          title: "Invite Sent",
          description: `Invite sent to ${
            influencers.length > 1 ? `${influencers.length} influencers` : influencerName || "influencer"
          }`,
          confirmText: "Ok",
        });
      } else {
        Toast.show({ type: "success", text1: "Invite sent" });
      }
    } catch (err: any) {
   
      setLoadingInvite(false);
      console.warn("Failed to send invite", err);
      let message = "Failed to send invites. Please try again.";
      try {

        const contentType = err?.headers?.get?.("content-type") || "";
        if (contentType.includes("application/json")) {
          const body = await err.json();
          message = body?.message || JSON.stringify(body) || message;
        } else {
          // Try to read text content
          const text = await err.text();
          if (text) message = text;
        }
      } catch (e) {
        // ignore
      }

      setModalVisible(false);
      if (openModal) {
        openModal({
          title: "Failed to Invite",
          description: message,
          confirmText: "Ok",
        });
      } else {
        Toast.show({ type: "error", text1: "Failed to invite", text2: message });
      }
    }
    finally {
      setLoadingInvite(false);
    }
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
          influencers={
            influencerIds
              ? influencerIds.map((id) => ({
                  id,
                  name: influencerIds.length === 1 ? influencerName : undefined,
                }))
              : undefined
          }
        />
      )}
    </>
  );
};

export default InviteToCampaignButton;
