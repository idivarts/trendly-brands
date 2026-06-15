import { BRANDS_FE_URL } from '@/shared-constants/app'
import { useBrandContext } from '@/contexts/brand-context.provider'
import { Text, View } from '@/shared-uis/components/theme/Themed'
import React from 'react'
import { Linking } from 'react-native'
import { Button } from 'react-native-paper'

/** wa.me expects digits only (country code + number, no + or spaces). */
const WHATSAPP_NUMBER_DIGITS = '917604007156'

const PayWallComponent = () => {
    const { selectedBrand } = useBrandContext()
    const brandId = selectedBrand?.id ?? '—'

    const whatsAppMessage = `Hi, I'd like to unlock the full Trendly workspace with higher limits. My brand ID is: ${brandId}.`

    const handleWhatsApp = () => {
        const url = `https://wa.me/${WHATSAPP_NUMBER_DIGITS}?text=${encodeURIComponent(whatsAppMessage)}`
        Linking.openURL(url)
    }

    const handleOpenDesktop = () => {
        Linking.openURL(BRANDS_FE_URL)
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 16, fontSize: 24, lineHeight: 24 * 1.5 }}>
                The full Trendly lives on desktop
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
                Trendly on mobile is a lightweight companion — a preview to plan on the go and
                stay on top of your work. The complete workspace, with full capacity and higher
                limits, is built for the desktop experience.
            </Text>
            <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 32 }}>
                To unlock everything and set up your workspace yourself, open Trendly in your
                desktop browser. Prefer a hand getting set up? Message our team on WhatsApp and
                we’ll take care of the rest for you.
            </Text>
            <Button mode="contained" icon="whatsapp" onPress={handleWhatsApp} style={{ marginBottom: 16 }}>
                Message us on WhatsApp
            </Button>
            <Button mode="outlined" icon="monitor" onPress={handleOpenDesktop}>
                Open Trendly on desktop
            </Button>
        </View>
    )
}

export default PayWallComponent
