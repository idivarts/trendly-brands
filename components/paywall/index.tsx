import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { default as React, useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import CancelPlanModal from './CancelPlanModal'
import PlanWrapper from './plans/PlanWrapper'


const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const isMobile = !xl

    const router = useMyNavigation()
    const { selectedBrand, setSelectedBrand } = useBrandContext()

    const [cancelPlan, setCancelPlan] = useState(false)

    // Live billing status listener
    useEffect(() => {
        if (selectedBrand?.id) {
            const bSnap = onSnapshot(
                doc(collection(FirestoreDB, 'brands'), selectedBrand.id),
                (data) => {
                    setSelectedBrand({ ...(data.data() as any), id: data.id }, false)
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
                    <Text variant="titleLarge">Need help?</Text>
                    <Text style={{ marginTop: 10, fontSize: 16, textAlign: 'center' }}>
                        If you have any query or faced any issues, please email at support@trendly.now
                    </Text>
                </View>

                {selectedBrand?.billing?.status == ModelStatus.Accepted &&
                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                        <Text variant="bodyLarge" onPress={() => setCancelPlan(true)}>Need to Cancel Plan? Click Here</Text>
                        {/* <Text style={{ marginTop: 10, fontSize: 16, textAlign: 'center' }} >
                        Click here to cancel
                    </Text> */}
                    </View>}
            </ScrollView>
            {cancelPlan && <CancelPlanModal onClose={() => setCancelPlan(false)} />}
        </>
    )
}

export default PayWallComponent