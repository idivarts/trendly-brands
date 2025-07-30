import { View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Linking } from 'react-native'
import { Button, Text, useTheme } from 'react-native-paper'

const PayWallComponent = () => {
    const theme = useTheme()

    const handleWhatsApp = () => {
        const phoneNumber = '+917604007156' // Replace with actual number
        const url = `https://wa.me/${phoneNumber}`
        Linking.openURL(url)
    }

    const handleEmail = () => {
        const email = 'support@trendly.now'
        Linking.openURL(`mailto:${email}`)
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
                Your Brand Request is Being Reviewed
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
                We've received your request to create a brand. It may take a few hours for us to validate your account.
                We’ll contact you via your email or phone number once it’s done.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 32 }}>
                If your account hasn’t been validated yet and you’d like to get in touch, you can contact us directly:
            </Text>
            <Button mode="contained" icon="whatsapp" onPress={handleWhatsApp} style={{ marginBottom: 16 }}>
                Message us on WhatsApp
            </Button>
            <Button mode="outlined" icon="email" onPress={handleEmail}>
                Send us an Email
            </Button>
        </View>
    )
}

export default PayWallComponent