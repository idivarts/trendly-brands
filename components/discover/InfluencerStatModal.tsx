import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { Theme, useTheme } from '@react-navigation/native'
import React from 'react'
import { Image, Linking, ScrollView, StyleSheet } from 'react-native'
import { Button, Card, Divider, IconButton, Modal, Portal } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { InfluencerItem, StatChip } from './DiscoverInfluencer'

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
    avatar: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
    chip: { marginRight: 6, marginBottom: 6 },
})

export const InfluencerStatsModal: React.FC<{ visible: boolean; item: InfluencerItem | null; onClose: () => void }> = ({ visible, item, onClose }) => {
    const theme = useTheme()
    const styles = useStatsModalStyles(theme)

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.container}>

                <Card style={styles.modalCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginLeft: 24, marginTop: 24 }}>
                        <View style={styles.row}>
                            {!!item?.picture && (
                                <Image source={{ uri: item.picture }} style={styles.avatar} />
                            )}
                            <Card.Title title={item?.fullname} subtitle={item ? `@${item.username}` : undefined} />
                        </View>
                        <Card.Actions>
                            <Button mode="contained" onPress={() => {
                                Toaster.success("Our team is notifed", "We are working to bring the influencer in your contact")
                            }}>Request Connection</Button>
                            <IconButton icon="open-in-new" onPress={() => item?.url && Linking.openURL(item.url)} />
                            <IconButton icon="close" onPress={onClose} />
                        </Card.Actions>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />
                    <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ flex: 1, marginBottom: 24 }}>
                        <Card.Content>
                            <Card.Title title={"Statistics"} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16 }}>
                                <StatChip label="Followers" value={item?.followers} />
                                <StatChip label="Engagements" value={item?.engagements} />
                                <StatChip label="ER (in %)" value={((item?.engagementRate || 0) * 100)} />
                                <StatChip label="Reel Plays" value={item?.reelPlays} />
                            </View>
                        </Card.Content>
                        <Card.Content>
                            <Card.Title title={"Growth"} />
                            <View style={{ height: 200 }}>

                            </View>
                        </Card.Content>

                        <Card.Content>
                            <Card.Title title={"Some Other Metrics"} />
                            <View style={{ height: 400 }}>

                            </View>
                        </Card.Content>
                    </ScrollView>
                </Card>
            </Modal>
            <Toast />
        </Portal>
    )
}