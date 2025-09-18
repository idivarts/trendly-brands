import { useBrandContext } from '@/contexts/brand-context.provider'
import { useConfirmationModel } from '@/shared-uis/components/ConfirmationModal'
import { FacebookImageComponent } from '@/shared-uis/components/image-component'
import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { Theme, useTheme } from '@react-navigation/native'
import React from 'react'
import { Linking, ScrollView, StyleSheet } from 'react-native'
import { Button, Card, Divider, IconButton, Modal, Portal } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { InfluencerItem } from './DiscoverInfluencer'
import { DB_TYPE } from './RightPanelDiscover'
import TrendlyAnalyticsEmbed from './trendly/TrendlyAnalyticsEmbed'

const useStatsModalStyles = (theme: Theme) => StyleSheet.create({
    container: {
        alignSelf: 'center',
        width: 650,
        maxHeight: "90%",
        maxWidth: '92%',
        marginVertical: 16,
    },
    modalCard: {
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: Colors(theme).modalBackground,
    },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 64, height: 64, borderRadius: 8, marginRight: 12, backgroundColor: Colors(theme).primary },
    chip: { marginRight: 6, marginBottom: 6 },
})

export const InfluencerStatsModal: React.FC<{ visible: boolean; item: InfluencerItem | null; onClose: () => void, selectedDb: DB_TYPE }> = ({ visible, item, onClose, selectedDb }) => {
    const theme = useTheme()
    const styles = useStatsModalStyles(theme)
    const { selectedBrand } = useBrandContext()
    const { openModal } = useConfirmationModel()

    const sendInvite = () => {
        if ((selectedBrand?.credits?.connection || 0) <= 0) {
            openModal({
                title: "No Connection Credit",
                description: "You seem to have exhausted the connection credit. Contact support for recharging the credit",
                confirmText: "Contact Support",
                confirmAction: () => {
                    Linking.openURL("mailto:support@idiv.in")
                }
            })
            return
        }
    }

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.container}>

                <Card style={styles.modalCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginLeft: 24, marginTop: 24 }}>
                        <View style={styles.row}>
                            {!!item?.picture && (
                                <FacebookImageComponent url={item.picture} style={styles.avatar} altText={item.fullname} />
                            )}
                            <Card.Title title={item?.fullname} subtitle={item ? `@${item.username}` : undefined} />
                        </View>
                        <Card.Actions>
                            <Button mode="contained" onPress={() => sendInvite()}>Invite</Button>
                            <IconButton icon="open-in-new" onPress={() => item?.url && Linking.openURL(item.url)} />
                            <IconButton icon="close" onPress={onClose} />
                        </Card.Actions>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />
                    <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ flex: 1, marginBottom: 24 }}>
                        {(selectedDb == "trendly" && item && selectedBrand) && <TrendlyAnalyticsEmbed influencer={item} selectedBrand={selectedBrand} />}
                    </ScrollView>
                </Card>
            </Modal>
            <Toast />
        </Portal>
    )
}