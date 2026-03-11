import Colors from "@/shared-uis/constants/Colors";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { Linking } from "react-native";
import { Button } from "react-native-paper";
import { collection, doc, setDoc } from "firebase/firestore";
import InviteToCampaignModal from "./InviteToCampaignModal";

interface InviteButtonProps {
    label?: string;
    disabled?: boolean;
    openModal: (args: any) => void;
    influencerIds?: string[];
    influencerName?: string;
    brandId?: string;
    connectionCredits?: number;
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
    label = "Invite",
    disabled,
    openModal,
    influencerIds,
    influencerName,
    brandId,
    connectionCredits,
}) => {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(false);

    // ✅ Get selectedBrand directly from context
    const { selectedBrand } = useBrandContext();
    const effectiveBrandId = brandId ?? selectedBrand?.id;
    const effectiveCredits =
        connectionCredits ?? selectedBrand?.credits?.connection ?? 0;

    const handleInvitePress = () => {
        if (effectiveCredits <= 0) {
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

    const handleInviteConfirm = async (
        selectedIds: string[]
    ): Promise<boolean> => {
        console.log("Inviting influencer to campaigns:", selectedIds);

        if (!effectiveBrandId) {
            openModal({
                title: "No Brand Selected",
                description: "Please select a brand to invite influencers.",
                confirmText: "Ok",
            });
            return false;
        }

        const influencers = influencerIds || [];

        if (influencers.length === 0) {
            openModal({
                title: "No Influencer Selected",
                description: "Please select atleast one influencer to invite.",
                confirmText: "Ok",
            });
            return false;
        }

        const payload = {
            influencers: influencers,
            collaborations: selectedIds || [],
        };
        console.log("Invite payload:", payload);

        if (loadingInvite) return false; // avoid duplicates
        setLoadingInvite(true);

        try {
            await HttpWrapper.fetch(
                `/discovery/brands/${effectiveBrandId}/influencers/invite`,
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            );

            // Write each invitation to Firestore so Invited Members tab shows them
            const managerId = AuthApp.currentUser?.uid;
            if (managerId) {
                for (const collaborationId of selectedIds || []) {
                    for (const influencerId of influencers) {
                        const invitationColRef = collection(
                            FirestoreDB,
                            "collaborations",
                            collaborationId,
                            "invitations"
                        );
                        const invitationDocRef = doc(invitationColRef, influencerId);
                        await setDoc(invitationDocRef, {
                            userId: influencerId,
                            managerId,
                            collaborationId,
                            status: "pending",
                            message: "",
                            timeStamp: Date.now(),
                        }).catch((e) => console.warn("Firestore invite write failed", e));
                        try {
                            await HttpWrapper.fetch(
                                `/api/collabs/collaborations/${collaborationId}/invitations/${influencerId}`,
                                { method: "POST" }
                            );
                        } catch (_) {
                            // Firestore is source of truth for Invited Members; API is best-effort
                        }
                    }
                }
            }

            Toaster.success("Invite sent");
            return true;
        } catch (err: any) {
            console.warn("Failed to send invite", err);
            Toaster.error("Something went wrong!");
            return false;
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
                    brandId={effectiveBrandId}
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
