import InfluencerApplication from '@/components/collaboration-applications/InfluencerApplications'
import { View } from '@/components/theme/Themed'
import { usePublicContext } from '@/contexts/public-context-provider'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

const CollaborationApplication = () => {
    const { collaborationId, applicationId } = useLocalSearchParams()
    const { isLoading, session } = usePublicContext()

    if (isLoading)
        return <View style={styles.center}>
            <ActivityIndicator size={"small"} />
        </View>
    if (!session || !collaborationId || !applicationId) {
        return (
            <View style={styles.center}>
                <Text>Something went wrong. Please check your session or collaboration link.</Text>
            </View>
        )
    }
    return (
        <InfluencerApplication collaborationId={collaborationId as string} influencerId={applicationId as string} />
    )
}

export default CollaborationApplication