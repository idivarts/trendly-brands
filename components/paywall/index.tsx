import { useBrandContext } from '@/contexts/brand-context.provider'
import { useBreakpoints } from '@/hooks'
import { ModelStatus } from '@/shared-libs/firestore/trendly-pro/models/status'
import { Console } from '@/shared-libs/utils/console'
import { FirestoreDB } from '@/shared-libs/utils/firebase/firestore'
import { HttpWrapper } from '@/shared-libs/utils/http-wrapper'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { View } from '@/shared-uis/components/theme/Themed'
import Toaster from '@/shared-uis/components/toaster/Toaster'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Platform, ScrollView } from 'react-native'
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

const enterPriseFeatures = [
    'Agency Level Support',
    'Collaboration Boosting Support',
    'Other Mentorship Support',
    'Social Media Management',
    'And Other ...',
]


const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const { selectedBrand } = useBrandContext()
    const isMobile = !xl
    const router = useMyNavigation()

    const [loading, setLoading] = useState(false)
    const [myBrand, setMyBrand] = useState(selectedBrand)
    const [link, setLink] = useState("")

    const openPurchase = async (isGrowth: boolean) => {
        try {
            setLoading(true)
            await HttpWrapper.fetch("/razorpay/create-subscription", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    brandId: myBrand?.id,
                    isGrowthPlan: isGrowth
                })
            }).then(async res => {
                const data = await res.json()
                const link = data.link
                setLink(link)
                Linking.openURL(link)
            })

        } catch (err) {
            setLoading(false)
            Toaster.error("Something went wrong!!")
        }
    }
    const handleFocus = async () => {
        Console.log("Handling Focus")
        if (!myBrand)
            return
        if (myBrand.billing?.status == ModelStatus.Accepted)
            router.resetAndNavigate("/explore-influencers")
    }

    useEffect(() => {
        handleFocus()
    }, [myBrand])

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
            <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background, alignSelf: "center" }}>
                {/* Marketing Section */}
                <View style={{ marginBottom: 40, alignItems: "center" }}>
                    <Text variant="headlineLarge" style={{ fontWeight: 'bold', marginBottom: 20 }}>
                        Pick a Plan
                    </Text>
                    <Text style={{ marginBottom: 24, fontSize: 16 }}>
                        You are just one step away to access 1000s of creators database and start running your campaigns
                    </Text>

                    {myBrand?.billing === undefined &&
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            <Chip icon="clock-fast" style={{ backgroundColor: '#FFF3CD' }}>
                                <Text style={{ color: '#856404' }}>3-Day Free Trial</Text>
                            </Chip>
                            <Chip icon="cash-refund" style={{ backgroundColor: '#D4EDDA' }}>
                                <Text style={{ color: '#155724' }}>7-Day Money Back Guarantee</Text>
                            </Chip>
                        </View>}
                </View>

                {/* Pricing Section */}
                <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 24 }}>
                    <View style={[{ width: '100%', paddingTop: isMobile ? 0 : 54 }, !isMobile && { maxWidth: 300 }]}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20 }}>
                            <Card.Content style={{ gap: 4 }}>
                                {/* {!isMobile && <Chip style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: theme.colors.backdrop }}>
                                    For New Brands
                                </Chip>} */}
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
                                <View style={{ width: '100%', marginTop: 16 }}>
                                    <Button mode="outlined" onPress={() => { openPurchase(true) }} style={{ width: '100%' }}>Choose Growth</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>
                                    Benefits:
                                </Text>
                                {growthPlanFeatures.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, alignSelf: "center" }}>✔</Text>
                                        <Text style={{ fontSize: 16, marginLeft: 8 }}>{item}</Text>
                                    </View>
                                ))}
                            </Card.Content>

                        </Card>
                    </View>

                    <View style={[{ width: '100%' }, !isMobile && { maxWidth: 320 }]}>
                        <Card style={[{
                            flex: 1, padding: isMobile ? 12 : 20, backgroundColor: "#F0FFF0",
                        }, !isMobile && {
                            elevation: 6, // For Android
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.2,
                            shadowRadius: 24,
                        }]}>
                            <Card.Content style={{ gap: 4 }}>
                                <Chip icon="check-circle" style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: '#A8E4A0' }}>
                                    <Text style={{ color: '#004085' }}>Preferred</Text>
                                </Chip>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer, marginBottom: 12 }}>
                                    Business Plan
                                </Text>
                                <Text style={{ fontSize: 22, color: theme.colors.onPrimaryContainer, marginBottom: 8 }}>
                                    ₹ <Text style={{ fontSize: 28, color: theme.colors.onPrimaryContainer }}>4,999 </Text>
                                    <Text style={{ fontSize: 16, textDecorationLine: 'line-through', color: theme.colors.onPrimaryContainer }}> 6000 </Text>
                                    <Text style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}> / year</Text>
                                </Text>
                                <Text style={{ marginTop: 8, fontSize: 16, color: theme.colors.onPrimaryContainer }}>
                                    Ideal for established businesses scaling influencer marketing.
                                </Text>
                            </Card.Content>
                            <Card.Actions>
                                <View style={{ width: '100%', backgroundColor: "transparent", marginTop: 16 }}>
                                    <Button mode="contained" onPress={() => { openPurchase(false) }} style={{ width: '100%' }}>Choose Business</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>
                                    Benefits:
                                </Text>
                                {businessPlanFeatures.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, backgroundColor: "transparent" }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.onPrimaryContainer, alignSelf: "center" }}>✔</Text>
                                        <Text style={{ fontSize: 16, marginLeft: 8, color: theme.colors.onPrimaryContainer }}>{item}</Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>
                    <View style={[{ width: '100%', paddingTop: isMobile ? 0 : 54 }, !isMobile && { maxWidth: 300 }]}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20 }}>
                            <Card.Content style={{ gap: 4 }}>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                                    Enterprise
                                </Text>
                                <Text style={{ fontSize: 22, marginBottom: 8 }}>
                                    <Text style={{ fontSize: 28 }}>Contact Us</Text>
                                </Text>
                                <Text style={{ marginTop: 8, fontSize: 16 }}>
                                    If you are looking for something custom
                                </Text>
                            </Card.Content>
                            <Card.Actions>
                                <View style={{ width: '100%', marginTop: 16 }}>
                                    <Button mode="outlined" onPress={() => { window.open("mailto:support@trendly.now") }} style={{ width: '100%' }}>Contact Sales</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>
                                    Benefits:
                                </Text>
                                {enterPriseFeatures.map((item, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, alignSelf: "center" }}>✔</Text>
                                        <Text style={{ fontSize: 16, marginLeft: 8 }}>{item}</Text>
                                    </View>
                                ))}
                            </Card.Content>

                        </Card>
                    </View>
                </View>

                {/* Contact Support Section */}
                <View style={{ marginTop: 40, alignItems: "center" }}>
                    <Text variant="titleLarge">Facing issues with Purchase?</Text>
                    <Text style={{ marginTop: 10, fontSize: 16, textAlign: "center" }}>
                        Dont worry! We are here to assist you! Contact us at: support@trendly.now
                    </Text>
                </View>
            </ScrollView >
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: 16,
                    gap: 16
                }}>
                    <Text style={{ fontSize: 32, lineHeight: 32 * 1.5, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>Return Back here once Payment is done</Text>
                    <ActivityIndicator size={"large"} />
                    <Text style={{ fontSize: 18, lineHeight: 18 * 1.5, marginTop: 24, textAlign: "center" }}>
                        Redirecting you to the payment page. Please wait ...
                    </Text>

                    {link && (
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 44 }}>
                            <Text style={{ fontSize: 16 }}>
                                If you didn’t redirect automatically
                            </Text>
                            <Text
                                style={{ fontSize: 16, color: 'blue', textDecorationLine: 'underline' }}
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        window.open(link, '_blank')
                                    }
                                }}
                            >
                                Click Here
                            </Text>
                        </View>
                    )}

                </View>
            )
            }
        </>
    )
}

export default PayWallComponent