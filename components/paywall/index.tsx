import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { default as React, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import CancelPlanModal from './CancelPlanModal'
import PlanWrapper from './plans/PlanWrapper'


const PayWallComponent = () => {
    const theme = useTheme()
    const { xl, width } = useBreakpoints()
    const isMobile = !xl
    const colors = useMemo(() => Colors(theme), [theme])
    const styles = useMemo(
        () => createStyles(colors, isMobile, width, xl),
        [colors, isMobile, width, xl],
    )

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
                    <Text variant="titleLarge" style={styles.contactTitle}>Need help?</Text>
                    <Text style={styles.contactText}>
                        If you have any query or faced any issues, please email at support@trendly.now
                    </Text>
                </View>

                {selectedBrand?.billing?.status == ModelStatus.Accepted &&
                    <View style={styles.cancelSection}>
                        <Text
                            variant="bodyLarge"
                            style={styles.cancelLink}
                            onPress={() => setCancelPlan(true)}
                        >
                            Need to Cancel Plan? Click Here
                        </Text>
                    </View>}
            </ScrollView>
            {cancelPlan && <CancelPlanModal onClose={() => setCancelPlan(false)} />}
        </>
    )
}

function createStyles(
    colors: ReturnType<typeof Colors>,
    isMobile: boolean,
    width: number,
    xl: boolean,
) {
    return StyleSheet.create({
        header: {
            alignItems: 'center',
            marginBottom: 24,
        },
        headerTitle: {
            fontWeight: 'bold',
            marginBottom: 8,
            color: colors.text,
        },
        headerSubtitle: {
            opacity: 0.8,
            textAlign: 'center',
            maxWidth: 680,
            color: colors.textSecondary,
        },
        scrollContent: {
            padding: isMobile ? 20 : 40,
            backgroundColor: colors.background,
            alignSelf: 'center',
            width: '100%',
            ...(xl ? { maxWidth: Math.min(width, 1200) } : {}),
        },
        contactSection: {
            marginTop: 40,
            alignItems: 'center',
        },
        contactTitle: {
            color: colors.text,
        },
        contactText: {
            marginTop: 10,
            fontSize: 16,
            textAlign: 'center',
            color: colors.textSecondary,
        },
        cancelSection: {
            marginTop: 40,
            alignItems: 'center',
        },
        cancelLink: {
            color: colors.primary,
        },
    })
}

export default PayWallComponent
