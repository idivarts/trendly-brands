import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { Console } from '@/shared-libs/utils/console'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { Button, Card, Chip, Text, useTheme } from 'react-native-paper'

const growthPlanFeatures = [
    '5 collaborations/month',
    'Unlimited applications and contracts',
]

const businessPlanFeatures = [
    'Everything in Growth Plan',
    'Unlimited posting',
    'Guaranteed influencer availability',
    'Fraud recovery support',
    'Fast-track support',
    'First hire assistance included *',
]

const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const { selectedBrand } = useBrandContext()
    const isMobile = !xl

    const [loading, setLoading] = useState(false)
    const [myBrand, setMyBrand] = useState(selectedBrand)

    const handleFocus = async () => {
        Console.log("Handling Focus")
    }

    useEffect(() => {
        if (selectedBrand?.id) {
            const bSnapShop = onSnapshot(doc(collection(FirestoreDB, "brands"), selectedBrand.id), (data) => {
                setMyBrand({
                    ...data.data() as any,
                    id: data.id
                })
            }, (err) => {
                Toaster.error("Something went wrong!", "Cant load your brand")
            })

            return () => bSnapShop()
        }
    }, [selectedBrand])

    useEffect(() => {
        if (Platform.OS !== 'web') return

        let isRunning = false

        const safeHandleFocus = async () => {
            if (isRunning) return
            isRunning = true

            try {
                await handleFocus()
            } finally {
                isRunning = false
            }
        }

        const onFocus = () => {
            safeHandleFocus()
        }

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                safeHandleFocus()
            }
        }

        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    return (
        <>
            <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background, maxWidth: 860, alignSelf: "center" }}>
                {/* Marketing Section */}
                <View style={{ marginBottom: 40, alignItems: "center" }}>
                    <Text variant="headlineLarge" style={{ fontWeight: 'bold', marginBottom: 20 }}>
                        Pick a Plan
                    </Text>
                    <Text style={{ marginBottom: 24, fontSize: 16 }}>
                        You are just one step away to access 100s of creators database and start running your campaigns
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        <Chip icon="clock-fast" style={{ backgroundColor: theme.colors.secondaryContainer }}>
                            3-Day Free Trial
                        </Chip>
                        <Chip icon="cash-refund" style={{ backgroundColor: "green" }}>
                            14-Day Money Back Guarantee
                        </Chip>
                    </View>
                </View>

                {/* Pricing Section */}
                <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: isMobile ? 24 : 60 }}>
                    <View style={{ maxWidth: 400, width: '100%' }}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20 }}>
                            <Card.Content style={{ gap: 4 }}>
                                {!isMobile && <Chip style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: theme.colors.backdrop }}>
                                    For New Brands
                                </Chip>}
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                                    Growth Plan
                                </Text>
                                <Text style={{ fontSize: 22, marginBottom: 8 }}>
                                    ₹ <Text style={{ fontSize: 28 }}>499</Text> <Text style={{ fontWeight: 'bold' }}>/ month</Text>
                                </Text>
                                <Text style={{ marginTop: 8, fontSize: 16 }}>
                                    Best for small teams getting started with collaborations.
                                </Text>
                            </Card.Content>
                            <Card.Actions>
                                <View style={{ width: '100%' }}>
                                    <Button mode="contained-tonal" onPress={() => { }} style={{ width: '100%' }}>Choose Growth</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>
                                    Benefits:
                                </Text>
                                {growthPlanFeatures.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, alignSelf: "center" }}>✔</Text>
                                        <Text style={{ fontSize: 18, marginLeft: 8 }}>{item}</Text>
                                    </View>
                                ))}
                            </Card.Content>

                        </Card>
                    </View>

                    <View style={{ maxWidth: 400, width: '100%' }}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }}>
                            <Card.Content style={{ gap: 4 }}>
                                <Chip icon="check-circle" style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: theme.colors.secondaryContainer }}>
                                    Preferred
                                </Chip>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer, marginBottom: 12 }}>
                                    Business Plan
                                </Text>
                                <Text style={{ fontSize: 22, color: theme.colors.onPrimaryContainer, marginBottom: 8 }}>
                                    ₹ <Text style={{ fontSize: 28, color: theme.colors.onPrimaryContainer }}>4,999 </Text>
                                    <Text style={{ textDecorationLine: 'line-through', color: theme.colors.onPrimaryContainer }}>6000</Text>
                                    <Text style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}> / year</Text>
                                </Text>
                                <Text style={{ marginTop: 8, fontSize: 16, color: theme.colors.onPrimaryContainer }}>
                                    Ideal for established businesses scaling influencer marketing.
                                </Text>
                            </Card.Content>
                            <Card.Actions>
                                <View style={{ width: '100%' }}>
                                    <Button mode="contained" onPress={() => { }} style={{ width: '100%' }}>Choose Business</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>
                                    Benefits:
                                </Text>
                                {businessPlanFeatures.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.onPrimaryContainer, alignSelf: "center" }}>✔</Text>
                                        <Text style={{ fontSize: 18, marginLeft: 8, color: theme.colors.onPrimaryContainer }}>{item}</Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>
                </View>

                {/* Contact Support Section */}
                <View style={{ marginTop: 40 }}>
                    <Card style={{ padding: 20 }}>
                        <Card.Content>
                            <Text variant="titleLarge">Need Help or Custom Plan?</Text>
                            <Text style={{ marginTop: 10, fontSize: 16 }}>
                                If you have custom requirements or want to discuss anything before booking, feel free to reach out.
                            </Text>
                            <Text style={{ marginTop: 10, fontWeight: 'bold', fontSize: 16 }}>
                                Contact us at: support@trendly.now
                            </Text>
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>
            {/* {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    gap: 16
                }}>
                    <ActivityIndicator />
                    <Text style={{ color: 'white', fontSize: 18 }}>Setting up your brand...</Text>
                </View>
            )} */}
        </>
    )
}

export default PayWallComponent