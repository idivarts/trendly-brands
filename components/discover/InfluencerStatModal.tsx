import { View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Image, Linking, StyleSheet } from 'react-native'
import { Card, IconButton, Modal, Portal, Text, useTheme as usePaperTheme } from 'react-native-paper'
import { InfluencerItem, StatChip } from './DiscoverInfluencer'

const useStatsModalStyles = () => StyleSheet.create({
    modalCard: { margin: 16, borderRadius: 16, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
    chip: { marginRight: 6, marginBottom: 6 },
})

export const InfluencerStatsModal: React.FC<{ visible: boolean; item: InfluencerItem | null; onClose: () => void }> = ({ visible, item, onClose }) => {
    const paper = usePaperTheme()
    const styles = useStatsModalStyles()

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose}>
                <Card style={styles.modalCard}>
                    <Card.Title title={item?.fullname} subtitle={item ? `@${item.username}` : undefined} />
                    <Card.Content>
                        <View style={styles.row}>
                            {!!item?.picture && (
                                <Image source={{ uri: item.picture }} style={styles.avatar} />
                            )}
                            {!!item?.url && (
                                <Text onPress={() => Linking.openURL(item.url)} style={{ color: paper.colors.primary }}>
                                    {item.url}
                                </Text>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <StatChip label="Followers" value={item?.followers} />
                            <StatChip label="Engagements" value={item?.engagements} />
                            <StatChip label="ER (in %)" value={((item?.engagementRate || 0) * 100)} />
                            <StatChip label="Reel Plays" value={item?.reelPlays} />
                        </View>
                    </Card.Content>
                    <Card.Actions>
                        <IconButton icon="open-in-new" onPress={() => item?.url && Linking.openURL(item.url)} />
                        <IconButton icon="close" onPress={onClose} />
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    )
}