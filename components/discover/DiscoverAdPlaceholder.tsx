import AppLayout from '@/layouts/app-layout'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import React from 'react'

const DiscoverAdPlaceholder = () => {
    // Use Themed.Text if available, otherwise fallback to Text from react-native
    // try {
    //     // eslint-disable-next-line @typescript-eslint/no-var-requires
    //     ThemedText = require('@/shared-uis/components/theme/Themed').Text
    // } catch {
    //     ThemedText = require('react-native').Text
    // }
    return (
        <AppLayout>
            <View
                style={{
                    padding: 24,
                    borderRadius: 16,
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                    margin: 24,
                }}
            >
                <Text
                    style={{
                        fontSize: 22,
                        fontWeight: 'bold',
                        marginBottom: 8,
                        textAlign: 'center',
                    }}
                >
                    Unlock Premium Access
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: '#444',
                        marginBottom: 16,
                        textAlign: 'center',
                    }}
                >
                    Pay Rs. 8000 to instantly access our database of 2.5M+ influencers.
                </Text>
                <Text
                    style={{
                        fontSize: 15,
                        color: '#666',
                        marginBottom: 20,
                        textAlign: 'center',
                    }}
                >
                    Upgrade now and supercharge your influencer discovery.
                </Text>
                <View
                    style={{
                        height: 300,
                        width: '100%',
                        backgroundColor: '#e5e5e5',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: '#888', fontSize: 16 }}>
                        YouTube Video Placeholder
                    </Text>
                </View>
            </View>
        </AppLayout>
    )
}

export default DiscoverAdPlaceholder