import { View } from '@/components/theme/Themed'
import { usePublicContext } from '@/contexts/public-context-provider'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Text } from 'react-native-paper'

const CollaborationApplication = () => {
    const { collaborationId, applicationId } = useLocalSearchParams()
    const { isLoading, session } = usePublicContext()

    if (isLoading)
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size={"small"} />
        </View>
    if (!session || !collaborationId || !applicationId) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Something went wrong. Please check your session or collaboration link.</Text>
            </View>
        )
    }
    return (
        <View>Hello there</View>
    )
}

export default CollaborationApplication