import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { default as React, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import CancelPlanModal from './CancelPlanModal'
import PlanWrapper, { BillingCycle, PlanKey } from './plans/PlanWrapper'


const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const isMobile = !xl

    const router = useMyNavigation()
    const { selectedBrand, updateBrand } = useBrandContext()

    const [loading, setLoading] = useState(false)
    const [myBrand, setMyBrand] = useState(selectedBrand)
    const [cancelPlan, setCancelPlan] = useState(false)

    const openPurchase = async (plan: PlanKey, c: BillingCycle) => {
        Toaster.info('Almost ready', 'This plan will be enabled shortly. Please contact support@trendly.now if you need early access.')
    }

    // Live billing status listener
    useEffect(() => {
        if (selectedBrand?.id) {
            const bSnap = onSnapshot(
                doc(collection(FirestoreDB, 'brands'), selectedBrand.id),
                (data) => {
                    setMyBrand({ ...(data.data() as any), id: data.id })
                },
                () => {
                    Toaster.error('Something went wrong!', 'Cant load your brand')
                }
            )
            return () => bSnap()
        }
    }, [selectedBrand?.id])


    const Header = <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Our Pricing</Text>
        <Text style={{ opacity: 0.8, textAlign: 'center', maxWidth: 680 }}>
            Explore our flexible pricing designed to fit every brand’s budget and objectives.
        </Text>
    </View>

    return (
        <>
            <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background, alignSelf: 'center' }}>
                {Header}

                <PlanWrapper />

                {/* Contact Support */}
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <Text variant="titleLarge">Need help choosing?</Text>
                    <Text style={{ marginTop: 10, fontSize: 16, textAlign: 'center' }}>
                        I’m here to help. Email: support@trendly.now
                    </Text>
                </View>

                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <Text variant="bodyLarge" onPress={() => setCancelPlan(true)}>Need to Cancel Plan? Click Here</Text>
                    {/* <Text style={{ marginTop: 10, fontSize: 16, textAlign: 'center' }} >
                        Click here to cancel
                    </Text> */}
                </View>
            </ScrollView>
            {cancelPlan && <CancelPlanModal onClose={() => setCancelPlan(false)} />}

            {/* Overlay while redirecting */}
            {loading && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: 16,
                        gap: 16,
                    }}
                >
                    <Text style={{ fontSize: 32, lineHeight: 32 * 1.5, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
                        Return here once payment is done
                    </Text>
                    <ActivityIndicator size="large" />
                    <Text style={{ fontSize: 18, lineHeight: 18 * 1.5, marginTop: 24, textAlign: 'center' }}>
                        Redirecting you to the payment page. Please wait...
                    </Text>
                </View>
            )}
        </>
    )
}

export default PayWallComponent