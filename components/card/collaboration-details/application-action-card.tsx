import { IApplications } from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { useConfirmationModel } from "@/shared-uis/components/ConfirmationModal";
import { Text, View } from "@/shared-uis/components/theme/Themed";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { InfluencerApplication } from "@/types/Collaboration";
import { convertToKUnits } from "@/utils/conversion";
import { useTheme } from "@react-navigation/native";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Button as PaperButton, Surface } from "react-native-paper";


export const ApplicationActionBar: React.FC<{
    application: InfluencerApplication["application"];
    onAccept?: () => void;
    onShortlist?: () => void;
    onReject?: () => void;
    onReopen?: () => void;
}> = ({ application, onAccept, onShortlist, onReject, onReopen }) => {
    const { openModal } = useConfirmationModel()
    const handleApplication = async (
        status: IApplications["status"]
    ) => {
        try {
            if (!application) return;

            const applicationRef = doc(
                FirestoreDB,
                "collaborations",
                application.collaborationId,
                "applications",
                application.id,
            );
            await updateDoc(applicationRef, {
                status: status,
            }).then(() => {
            });
        } catch (error) {
            Console.error(error);
            Toaster.error("Failed to accept application");
        }
    };

    const theme = useTheme();
    // const [confirm, setConfirm] = React.useState<null | { type: "accept" | "reject" | "reopen" | "shortlist"; title: string; desc: string }>(null);

    const [status, setStatus] = useState(application.status)

    const handle = async (type: "accept" | "reject" | "reopen" | "shortlist") => {
        switch (type) {
            case "accept":
                await handleApplication("accepted")
                if (onAccept) onAccept();
                setStatus("accepted")
                break;
            case "shortlist":
                await handleApplication("shortlisted")
                if (onShortlist) onShortlist();
                setStatus("shortlisted")
                break;
            case "reject":
                await handleApplication("rejected")
                if (onReject) onReject();
                setStatus("rejected")
                break;
            case "reopen":
                await handleApplication("pending")
                if (onReopen) onReopen();
                setStatus("pending")
                break;
        }
    };

    const dividerColor = theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

    const renderButtons = () => {
        switch (status) {
            case "pending":
                return (
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <PaperButton
                            mode="contained"
                            onPress={() => handle("shortlist")}
                        >
                            Shortlist
                        </PaperButton>
                        <PaperButton
                            mode="elevated"
                            onPress={() => openModal({
                                title: "Accept application?",
                                description: "This will create a message thread between you and the selected influencer.",
                                confirmText: "Accept",
                                confirmAction: () => handle("accept")
                            })}
                        >
                            Accept
                        </PaperButton>
                        <PaperButton
                            mode="text"
                            onPress={() => handle("reject")}
                        >
                            Reject
                        </PaperButton>
                    </View>
                );
            case "accepted":
                return (
                    <PaperButton mode="contained" disabled>
                        Accepted
                    </PaperButton>
                );
            case "shortlisted":
                return (
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <PaperButton
                            mode="contained"
                            onPress={() => openModal({
                                title: "Accept application?",
                                description: "This will create a message thread between you and the selected influencer.",
                                confirmText: "Accept",
                                confirmAction: () => handle("accept")
                            })}
                        >
                            Accept
                        </PaperButton>
                        <PaperButton
                            mode="text"
                            onPress={() => handle("reject")}
                        >
                            Reject
                        </PaperButton>
                    </View>
                );
            case "rejected":
                return (
                    <PaperButton
                        mode="elevated"
                        onPress={() => handle("reopen")}
                    >
                        Reopen
                    </PaperButton>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Surface style={{ borderRadius: 12, elevation: 2, overflow: "hidden" }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: 12, gap: 12 }}>
                    {/* Left: Quotation */}
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Quotation</Text>
                        <Text style={{ fontSize: 18, fontWeight: "700" }}>
                            {convertToKUnits(Number(application.quotation)) as string}
                        </Text>
                    </View>

                    {/* Divider */}
                    <View style={{ width: 1, alignSelf: "stretch", backgroundColor: dividerColor }} />

                    {/* Right: Actions */}
                    <View style={{ flexShrink: 0, flexGrow: 0, alignItems: "flex-end" }}>{renderButtons()}</View>
                </View>
            </Surface>

            {/* Confirmation Dialog
            <Portal>
                <Dialog visible={!!confirm} onDismiss={() => setConfirm(null)}>
                    <Dialog.Title>{confirm?.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text>{confirm?.desc}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <PaperButton onPress={() => setConfirm(null)}>Cancel</PaperButton>
                        {confirm && (
                            <PaperButton onPress={() => handle(confirm.type)}>Confirm</PaperButton>
                        )}
                    </Dialog.Actions>
                </Dialog>
            </Portal> */}
        </>
    );
};
