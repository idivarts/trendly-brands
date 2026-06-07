import { useBrandContext } from "@/contexts/brand-context.provider";
import { useActiveAgencyHire } from "@/hooks/useActiveAgencyHire";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking } from "react-native";
import { Button } from "react-native-paper";
import InviteToCampaignModal from "./InviteToCampaignModal";

interface InviteButtonProps {
    label?: string;
    disabled?: boolean;
    openModal: (args: any) => void;
    influencerIds?: string[];
    influencerName?: string;
    brandId?: string;
    connectionCredits?: number;
    /**
     * Whether this button represents a single discover-only (off-platform)
     * influencer. When true and the brand has no active agency hire, the invite
     * is gated behind hiring our agency. Omit for bulk/mixed selections — the
     * backend still enforces the gate and returns `agency-not-hired`.
     */
    isDiscover?: boolean;
}

const InviteToCampaignButton: React.FC<InviteButtonProps> = ({
    label = "Invite",
    disabled,
    openModal,
    influencerIds,
    influencerName,
    brandId,
    connectionCredits,
    isDiscover,
}) => {
    const theme = useTheme();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(false);

    // ✅ Get selectedBrand directly from context
    const { selectedBrand } = useBrandContext();
    const effectiveBrandId = brandId ?? selectedBrand?.id;
    const effectiveCredits =
        connectionCredits ?? selectedBrand?.credits?.connection ?? 0;

    const { hasActiveAgencyHire } = useActiveAgencyHire(effectiveBrandId);

    // Advertise hiring our agency, with a CTA that routes to the hire-us page.
    const promptHireUs = () => {
        openModal({
            title: "Hire us to invite this creator",
            description:
                "This creator isn't on Trendly yet. Hire our agency and we'll reach out and manage the collaboration for you.",
            confirmText: "Hire Us",
            confirmAction: () => router.push("/hire-us"),
        });
    };

    const handleInvitePress = () => {
        // Discover-only influencer with no active agency hire → advertise hiring us.
        if (isDiscover && !hasActiveAgencyHire) {
            promptHireUs();
            return;
        }

        // On-platform influencers are invited by email and don't consume
        // connection credits, so skip the credit gate for them.
        if (isDiscover !== false && effectiveCredits <= 0) {
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

            Toaster.success("Invite sent");
            return true;
        } catch (err: any) {
            // Backend gates discover-only invites behind an active agency hire.
            let code: string | undefined;
            if (err instanceof Response) {
                try {
                    const parsed = await err.clone().json();
                    code = parsed?.error;
                } catch { /* non-JSON body */ }
            }
            if (code === "agency-not-hired") {
                setModalVisible(false);
                promptHireUs();
                return false;
            }
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
                                  name:
                                      influencerIds.length === 1
                                          ? influencerName
                                          : undefined,
                              }))
                            : undefined
                    }
                    onNavigateToCampaigns={() => {
                        setModalVisible(false);
                        router.push("/collaborations");
                    }}
                />
            )}
        </>
    );
};

export default InviteToCampaignButton;
