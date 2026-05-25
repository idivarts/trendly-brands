import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import Colors from '@/shared-uis/constants/Colors'
import { faArrowRight, faBullhorn, faChartLine, faMagicWandSparkles, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useTheme } from '@react-navigation/native'
import { router } from 'expo-router'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { default as React, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet } from 'react-native'
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

                {/* Hire Us */}
                <HireUsCard colors={colors} isMobile={isMobile} />

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

// ─── Hire Us Card ─────────────────────────────────────────────────────────────

const HIRE_US_FEATURES = [
    { icon: faMagicWandSparkles, label: "Content Strategy & Creation" },
    { icon: faUsers,             label: "End-to-End Influencer Campaigns" },
    { icon: faBullhorn,          label: "Strategic Ad Spend Management" },
    { icon: faChartLine,         label: "Performance Marketing & ROAS" },
] as const;

interface HireUsCardProps {
    colors: ReturnType<typeof Colors>;
    isMobile: boolean;
}

const HireUsCard: React.FC<HireUsCardProps> = ({ colors, isMobile }) => {
    const cardStyles = useMemo(() => createHireUsStyles(colors, isMobile), [colors, isMobile]);

    return (
        <View style={cardStyles.wrapper}>
            {/* Accent stripe */}
            <View style={cardStyles.accentRow}>
                <View style={cardStyles.accentStripe} />
                <View style={cardStyles.accentContent}>
                    <Text style={cardStyles.eyebrow}>FULL-SERVICE AGENCY</Text>
                    <Text style={cardStyles.heading}>Want us to do it all for you?</Text>
                    <Text style={cardStyles.subheading}>
                        Let Trendly run your entire marketing operation — influencers, content,
                        ads, and performance tracking — under one roof. You brief us once; we
                        deliver results every month.
                    </Text>

                    <View style={cardStyles.featureGrid}>
                        {HIRE_US_FEATURES.map(({ icon, label }) => (
                            <View key={label} style={cardStyles.featureRow}>
                                <View style={cardStyles.featureIconWrap}>
                                    <FontAwesomeIcon icon={icon} size={14} color={colors.primary} />
                                </View>
                                <Text style={cardStyles.featureLabel}>{label}</Text>
                            </View>
                        ))}
                    </View>

                    <Pressable
                        style={cardStyles.cta}
                        onPress={() => router.push("/(main)/(drawer)/(secondary)/(modal)/hire-us")}
                    >
                        <Text style={cardStyles.ctaText}>Hire Trendly as Your Agency</Text>
                        <FontAwesomeIcon icon={faArrowRight} size={14} color={colors.white} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

function createHireUsStyles(colors: ReturnType<typeof Colors>, isMobile: boolean) {
    return StyleSheet.create({
        wrapper: {
            marginTop: 48,
            borderRadius: 20,
            backgroundColor: colors.budgetCardBg,
            overflow: "hidden",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 20,
            shadowOpacity: 0.18,
            elevation: 6,
        },
        accentRow: {
            flexDirection: "row",
            backgroundColor: "transparent",
        },
        accentStripe: {
            width: 5,
            backgroundColor: colors.primary,
        },
        accentContent: {
            flex: 1,
            padding: isMobile ? 20 : 32,
            gap: 16,
            backgroundColor: "transparent",
        },
        eyebrow: {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            color: colors.primary,
            textTransform: "uppercase",
        },
        heading: {
            fontSize: isMobile ? 20 : 24,
            fontWeight: "800",
            color: colors.text,
            lineHeight: isMobile ? 26 : 32,
        },
        subheading: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        featureGrid: {
            gap: 10,
            backgroundColor: "transparent",
        },
        featureRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "transparent",
        },
        featureIconWrap: {
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            shadowOpacity: 0.12,
            elevation: 2,
        },
        featureLabel: {
            fontSize: 14,
            fontWeight: "500",
            color: colors.text,
        },
        cta: {
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
            alignSelf: isMobile ? "stretch" : "flex-start",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        ctaText: {
            fontSize: 15,
            fontWeight: "700",
            color: colors.white,
        },
    });
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
