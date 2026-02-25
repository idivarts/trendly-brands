import InfluencerApplication from '@/components/collaboration-applications/InfluencerApplications';
import { usePublicContext } from '@/contexts/public-context-provider';
import { Text, View } from '@/shared-uis/components/theme/Themed';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native';

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const InflucerProfile = () => {
    const { influencerId } = useLocalSearchParams();
    const { isLoading, session } = usePublicContext()

    if (isLoading)
        return <View style={styles.center}>
            <ActivityIndicator size={"small"} />
        </View>
    if (!session || !influencerId) {
        return (
            <View style={styles.center}>
                <Text>Something went wrong. Please check your session or profile link.</Text>
            </View>
        )
    }
    return (
        <InfluencerApplication influencerId={influencerId as string} isPublic={true} />
    )
}

export default InflucerProfile