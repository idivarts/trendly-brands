import { useBrandContext } from '@/contexts/brand-context.provider'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Linking } from 'react-native'
import { Button } from 'react-native-paper'

const SUPPORT_EMAIL = 'support@trendly.now'
/** wa.me expects digits only (country code + number, no + or spaces). */
const WHATSAPP_NUMBER_DIGITS = '917604007156'

const PayWallComponent = () => {
    const { selectedBrand } = useBrandContext()
    const brandId = selectedBrand?.id ?? '—'

    const whatsAppMessage = `Hi, I'd like to activate my brand on Trendly. My brand ID is: ${brandId}.`
    const emailSubject = `Activate my brand (${brandId})`
    const emailBody = `Hi Trendly support,\n\nPlease activate my brand.\n\nBrand ID: ${brandId}\n\nThank you.`

    const handleWhatsApp = () => {
        const url = `https://wa.me/${WHATSAPP_NUMBER_DIGITS}?text=${encodeURIComponent(whatsAppMessage)}`
        // https://wa.me/917604007156?text=Hi%2C%20I%27d%20like%20to%20activate%20my%20brand%20on%20Trendly.%20My%20brand%20ID%20is%3A%20124325246.
        Linking.openURL(url)
    }

    const handleEmail = () => {
        const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
        Linking.openURL(url)
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 16, fontSize: 24, lineHeight: 24 * 1.5 }}>
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