import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { Theme, useTheme } from '@react-navigation/native'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { default as React, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import CancelPlanModal from './CancelPlanModal'
import PlanWrapper from './plans/PlanWrapper'


const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const isMobile = !xl
    const styles = useMemo(() => createStyles(theme, isMobile), [theme, isMobile])

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


    const Header = <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Our Pricing</Text>
        <Text style={styles.headerSubtitle}>
            Explore our flexible pricing designed to fit every brand’s budget and objectives.
        </Text>
    </View>

    return (
        <>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {Header}

                <PlanWrapper />

                {/* Contact Support */}
                <View style={styles.contactSection}>
                    <Text variant="titleLarge">Need help?</Text>
                    <Text style={styles.contactText}>
                        If you have any query or faced any issues, please email at support@trendly.now
                    </Text>
                </View>

                {selectedBrand?.billing?.status == ModelStatus.Accepted &&
                    <View style={styles.cancelSection}>
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

const createStyles = (theme: Theme, isMobile: boolean) =>
    StyleSheet.create({
        header: {
            alignItems: 'center',
            marginBottom: 24,
        },
        headerTitle: {
            fontWeight: 'bold',
            marginBottom: 8,
        },
        headerSubtitle: {
            opacity: 0.8,
            textAlign: 'center',
            maxWidth: 680,
        },
        scrollContent: {
            padding: isMobile ? 20 : 40,
            backgroundColor: Colors(theme).background,
            alignSelf: 'center',
        },
        contactSection: {
            marginTop: 40,
            alignItems: 'center',
        },
        contactText: {
            marginTop: 10,
            fontSize: 16,
            textAlign: 'center',
        },
        cancelSection: {
            marginTop: 40,
            alignItems: 'center',
        },
    })

export default PayWallComponent