import { useAuthContext } from '@/contexts';
import { BRANDS_FE_URL } from '@/shared-constants/app';
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal';
import Toaster from '@/shared-uis/components/toaster/Toaster';
import * as Clipboard from "expo-clipboard";
import React from 'react';
import { List } from 'react-native-paper';
import BottomSheetContainer from "../ui/bottom-sheet/BottomSheet";

interface IProps {
    influencerId: string | undefined,
    isModalVisible: boolean, toggleModal: () => void, openProfile: Function,
    applicationCopy?: { collaborationId: string, applicationId: string }
}

const InfluencerActionModal: React.FC<IProps> = ({ influencerId, isModalVisible, toggleModal, openProfile, applicationCopy }) => {
    const { manager, updateManager } = useAuthContext()
    const { openModal } = useConfirmationModel()
    const blockInfluencer = async () => {
        if (!manager?.id || !influencerId)
            return;
        const blockedInfluencers = new Set(manager.moderations?.blockedInfluencers || [])
        blockedInfluencers.add(influencerId)
        await updateManager(manager?.id, {
            ...manager,
            moderations: {
                ...manager.moderations,
                blockedInfluencers: [...blockedInfluencers]
            }
        })
        Toaster.success("Successfully Blocked")
    }
    const reportAndBlockInfluencer = async () => {
        if (!manager?.id || !influencerId)
            return;
        const blockedInfluencers = new Set(manager.moderations?.blockedInfluencers || [])
        const reportedInfluencers = new Set(manager.moderations?.reportedInfluencers || [])
        blockedInfluencers.add(influencerId)
        reportedInfluencers.add(influencerId)
        await updateManager(manager?.id, {
            ...manager,
            moderations: {
                ...manager.moderations,
                blockedInfluencers: [...blockedInfluencers],
                reportedInfluencers: [...reportedInfluencers]
            }
        })
        Toaster.success("Successfully Reported and Blocked")
    }

    return (
        <>
            {isModalVisible && (
                <BottomSheetContainer
                    isVisible={isModalVisible}
                    snapPointsRange={applicationCopy ? ["45%", "50%"] : ["35%", "50%"]}
                    onClose={toggleModal}
                >
                    <List.Section style={{ paddingBottom: 28 }}>
                        {applicationCopy && <List.Item title="Copy Application Link" onPress={async () => {
                            await Clipboard.setStringAsync(
                                `${BRANDS_FE_URL}/collaboration-application?collaborationId=${applicationCopy.collaborationId}&applicationId=${applicationCopy.applicationId}`
                            );
                            Toaster.success("Copied the link on Clipboard")
                            toggleModal()
                        }} />}
                        <List.Item
                            title="View Profile"
                            onPress={() => {
                                // bottomSheetModalRef.current?.present();
                                openProfile()
                                toggleModal();
                            }}
                        />
                        <List.Item
                            title="Copy Influencer Profile"
                            onPress={async () => {
                                // bottomSheetModalRef.current?.present();
                                await Clipboard.setStringAsync(
                                    `${BRANDS_FE_URL}/influencer/${influencerId}`
                                );
                                Toaster.success("Copied the Influencer Profile on Clipboard")
                                toggleModal();
                            }}
                        />
                        {/* <List.Item title="Send Message" onPress={() => null} /> */}
                        <List.Item title="Report and Block Influencer" onPress={() => {
                            openModal({
                                title: "Report and Block User",
                                description: "Are you sure you want to report and block this user? You wont be seeing any of their activities. We will review this report within 24 hours",
                                confirmText: "Report and Block",
                                confirmAction: reportAndBlockInfluencer
                            })
                            toggleModal()
                        }} />
                        <List.Item title="Block Influencer" onPress={() => {
                            openModal({
                                title: "Block user?",
                                description: "Are you sure you want to block this user? You wont be seeing any of their activities.",
                                confirmText: "Block",
                                confirmAction: blockInfluencer
                            })
                            toggleModal()
                        }} />

                    </List.Section>
                </BottomSheetContainer>
            )}
        </>
    )
}

export default InfluencerActionModal