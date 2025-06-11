import { useAuthContext } from '@/contexts';
import Toaster from '@/shared-uis/components/toaster/Toaster';
import React from 'react';
import { List } from 'react-native-paper';
import BottomSheetContainer from "../ui/bottom-sheet/BottomSheet";

interface IProps { influencerId: string | undefined, isModalVisible: boolean, toggleModal: () => void, openProfile: Function }

const InfluencerActionModal: React.FC<IProps> = ({ influencerId, isModalVisible, toggleModal, openProfile }) => {
    const { manager, updateManager } = useAuthContext()
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
                    snapPointsRange={["25%", "50%"]}
                    onClose={toggleModal}
                >
                    <List.Section style={{ paddingBottom: 28 }}>
                        <List.Item
                            title="View Profile"
                            onPress={() => {
                                // bottomSheetModalRef.current?.present();
                                openProfile()
                                toggleModal();
                            }}
                        />
                        {/* <List.Item title="Send Message" onPress={() => null} /> */}
                        <List.Item title="Report and Block Influencer" onPress={() => {
                            reportAndBlockInfluencer()
                            toggleModal()
                        }} />
                        <List.Item title="Block Influencer" onPress={() => {
                            blockInfluencer()
                            toggleModal()
                        }} />
                    </List.Section>
                </BottomSheetContainer>
            )}
        </>
    )
}

export default InfluencerActionModal