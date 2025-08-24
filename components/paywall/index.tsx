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
import { default as React, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Platform, ScrollView } from 'react-native'
import { Button, Card, Chip, SegmentedButtons, Text, useTheme } from 'react-native-paper'

type BillingCycle = 'annually' | 'monthly'
type PlanKey = 'starter' | 'growth' | 'pro'

/**
 * Base monthly prices (without any savings). The "Annually" option shows
 * the effective monthly price with a 2‑month discount (10/12 of base).
 * These match the new pricing you shared in the screenshot:
 * Starter 240/mo → 200/mo annually,
 * Growth 750/mo  → 625/mo annually,
 * Pro 1500/mo    → 1250/mo annually.
 */
const BASE_MONTHLY_PRICES: Record<PlanKey, number> = {
    starter: 240,
    growth: 750,
    pro: 1500,
}

const starterFeatures = [
    'Unlimited Influencer Browsing',
    'Advanced Filtering / Preferences',
    '20 influencer connects',
    'Upto 1 Collaboration',
    'Unlimited Applications / Invitations',
    'Max One Hiring (Contract)',
    'No Recovery Support',
]

const growthFeatures = [
    'Everything from Starter Plan',
    'Upto 50 influencer connects',
    '5 Collaboration posting',
    'One Free Collaboration Boosting',
    'Upto 8 Hiring (Contracts)',
    'General Hiring Support',
    'General Recovery Support',
]

const proFeatures = [
    'Everything on Growth Plan',
    'Unlimited Influencer Connects',
    'Unlimited Collaboration Postings',
    'Upto 5 Collaboration Boostings',
    'Unlimited Hirings (Contracts)',
    'End to End Hiring Support *',
    'Guaranteed Money Recovery Support *',
]

const PayWallComponent = () => {
    const theme = useTheme()
    const { xl } = useBreakpoints()
    const isMobile = !xl

    const router = useMyNavigation()
    const { selectedBrand, updateBrand } = useBrandContext()

    const [loading, setLoading] = useState(false)
    const [myBrand, setMyBrand] = useState(selectedBrand)

    // Frequency toggle
    const [cycle, setCycle] = useState<BillingCycle>('annually')

    // Payment links keyed by plan and cycle, if configured server-side
    const [links, setLinks] = useState<Partial<Record<`${PlanKey}:${BillingCycle}`, string>>>({})
    const [linkKeyPending, setLinkKeyPending] = useState<`${PlanKey}:${BillingCycle}` | undefined>(undefined)

    const priceFor = (plan: PlanKey, c: BillingCycle) => {
        const base = BASE_MONTHLY_PRICES[plan]
        if (c === 'monthly') return base
        // annually → 2 months free (effective monthly)
        return Math.round((base * 10) / 12)
    }

    const strikePriceFor = (plan: PlanKey, c: BillingCycle) => {
        // Only show strike-through when "Annually" (to highlight savings)
        if (c === 'annually') return BASE_MONTHLY_PRICES[plan]
        return undefined
    }

    const prettyNum = (n: number) => n.toLocaleString('en-IN')

    const fetchLinksIfNeeded = async () => {
        try {
            setLoading(true)
            // Attempt to fetch per-plan, per-cycle links from backend if available.
            // These endpoints are placeholders compatible with existing API style.
            // If your backend isn't ready yet, the UI will still work and simply
            // show a helpful message on purchase.
            const makeBody = (plan: PlanKey, c: BillingCycle) => ({
                brandId: selectedBrand?.id,
                plan,
                cycle: c,
            })

            const candidates: Array<[`${PlanKey}:${BillingCycle}`, RequestInit]> = [
                ['starter:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('starter', 'monthly')) }],
                ['starter:annually', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('starter', 'annually')) }],
                ['growth:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('growth', 'monthly')) }],
                ['growth:annually', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('growth', 'annually')) }],
                ['pro:monthly', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('pro', 'monthly')) }],
                ['pro:annually', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makeBody('pro', 'annually')) }],
            ]

            const results = await Promise.allSettled(
                candidates.map(async ([key, init]) => {
                    // Reuse the same endpoint you already use for subscriptions.
                    // Backward compatible: if the server doesn't understand the new
                    // params it can ignore them and return 4xx which we swallow.
                    const res = await HttpWrapper.fetch('/razorpay/create-subscription', init)
                    if (!res.ok) throw new Error('no-link')
                    const data = await res.json()
                    return [key, data.link as string] as const
                })
            )

            const map: Record<string, string> = {}
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const [key, v] = r.value
                    if (v) map[key] = v
                }
            })

            if (Object.keys(map).length) {
                setLinks(prev => ({ ...prev, ...map }))
                // Persist on the brand so you don't refetch on next load
                // updateBrand(selectedBrand?.id || '', { paymentLinksByPlan: { ...(selectedBrand?.paymentLinksByPlan as any), ...map } })
            }
        } catch (e) {
            // Silent; links are optional until backend is ready.
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // if (selectedBrand?.paymentLinksByPlan) {
        //     setLinks(selectedBrand.paymentLinksByPlan as any)
        // } else {
        //     // Best-effort fetch
        //     fetchLinksIfNeeded()
        // }
    }, [selectedBrand?.id])

    const openPurchase = async (plan: PlanKey, c: BillingCycle) => {
        const key: `${PlanKey}:${BillingCycle}` = `${plan}:${c}`
        setLinkKeyPending(key)

        const url = links[key]
        if (url) {
            try {
                if (Platform.OS === 'web') {
                    window.open(url, '_blank')
                } else {
                    Linking.openURL(url)
                }
            } catch {
                Toaster.error('Something went wrong!!')
            } finally {
                setLinkKeyPending(undefined)
            }
            return
        }

        // Fallback: tell user payments for this combo aren't configured yet.
        setLinkKeyPending(undefined)
        Toaster.info('Almost ready', 'This plan will be enabled shortly. Please contact support@trendly.now if you need early access.')
    }

    const handleFocus = async () => {
        Console.log('Handling Focus')
        if (!myBrand) return
        if (myBrand.billing?.status === ModelStatus.Accepted) {
            router.resetAndNavigate('/explore-influencers')
        }
    }

    useEffect(() => {
        handleFocus()
    }, [myBrand])

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

    // Re-run focus checks when the tab regains visibility (web)
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
        const onFocus = () => safeHandleFocus()
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') safeHandleFocus()
        }
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    const Header = useMemo(() => (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Our Pricing</Text>
            <Text style={{ opacity: 0.8, textAlign: 'center', maxWidth: 680 }}>
                Explore our flexible pricing designed to fit every brand’s budget and objectives.
            </Text>

            <View style={{ marginTop: 16, width: '100%', alignItems: 'center' }}>
                {/* {true && (
                    <Chip
                        icon="sale"
                        style={{ marginTop: 8, alignSelf: 'center', backgroundColor: '#FFE8CC', marginBottom: 16 }}
                        textStyle={{ fontWeight: '600', color: '#FF6F00' }}
                    >
                        Save 2 months on Annual
                    </Chip>
                )} */}

                <SegmentedButtons
                    value={cycle}
                    onValueChange={(v) => setCycle(v as BillingCycle)}
                    density="regular"
                    style={{ maxWidth: 500, width: '100%' }}
                    buttons={[
                        {
                            value: 'annually',
                            label: 'Annually (Save 2 months)',
                            icon: 'calendar-multiple-check',
                        },
                        {
                            value: 'monthly',
                            label: 'Monthly',
                            icon: 'calendar-month',
                        },
                    ]}
                />

            </View>
        </View>
    ), [cycle])

    const Price = ({ plan, c }: { plan: PlanKey; c: BillingCycle }) => {
        const strike = strikePriceFor(plan, c)
        const price = priceFor(plan, c)
        return (
            <View style={{ backgroundColor: "transparent" }}>
                <Text style={{ fontSize: 22, marginBottom: 8 }}>
                    ₹ <Text style={{ fontSize: 28 }}>{prettyNum(price)}</Text>
                    &nbsp;{strike !== undefined && (
                        <Text style={{ fontSize: 16, textDecorationLine: 'line-through', opacity: 0.7 }}>{prettyNum(strike)}</Text>
                    )}
                    &nbsp;<Text style={{ fontWeight: 'bold' }}>/ mon</Text>
                </Text>
                {strike !== undefined && (
                    <Chip
                        icon="sale"
                        style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#FFE8CC' }}
                        textStyle={{ fontWeight: '600', color: '#FF6F00' }}
                    >
                        Save ₹{prettyNum((strike - price) * 12)} on yearly plan
                    </Chip>
                )}
            </View>
        )
    }

    const Feature = ({ children, dim }: { children: React.ReactNode; dim?: boolean }) => (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, opacity: dim ? 0.9 : 1, backgroundColor: "transparent" }}>
            <Text style={{ fontSize: 12, alignSelf: 'center' }}>✔</Text>
            <Text style={{ fontSize: 16, marginLeft: 8 }}>{children}</Text>
        </View>
    )

    return (
        <>
            <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background, alignSelf: 'center' }}>
                {Header}

                <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 24 }}>
                    {/* Starter */}
                    <View style={[{ width: '100%', paddingTop: isMobile ? 0 : 54 }, !isMobile && { maxWidth: 300 }]}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20 }}>
                            <Card.Content style={{ gap: 4 }}>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>Starter</Text>
                                <Price plan="starter" c={cycle} />
                                <Text style={{ marginTop: 8, fontSize: 16 }}>For early experiments, limited usage</Text>
                            </Card.Content>

                            <Card.Actions>
                                <View style={{ width: '100%', marginTop: 16 }}>
                                    <Button mode="outlined" onPress={() => openPurchase('starter', cycle)} style={{ width: '100%' }}>Choose Plan</Button>
                                </View>
                            </Card.Actions>

                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>What’s included:</Text>
                                {starterFeatures.map((f, i) => (
                                    <Feature key={i}>{f}</Feature>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Growth (Preferred) */}
                    <View style={[{ width: '100%' }, !isMobile && { maxWidth: 320 }]}>
                        <Card
                            style={[
                                { flex: 1, padding: isMobile ? 12 : 20, backgroundColor: '#F0F6FF' },
                                !isMobile && {
                                    elevation: 6,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 24,
                                },
                            ]}
                        >
                            <Card.Content style={{ gap: 4 }}>
                                <Chip icon="star-circle" style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: '#CFE2FF' }}>
                                    <Text style={{ color: '#003087' }}>Preferred</Text>
                                </Chip>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>Growth</Text>
                                <Price plan="growth" c={cycle} />
                                <Text style={{ marginTop: 8, fontSize: 16 }}>For serious brands, multiple collabs, real hiring.</Text>
                            </Card.Content>
                            <Card.Actions>
                                <View style={{ width: '100%', marginTop: 16 }}>
                                    <Button mode="contained" onPress={() => openPurchase('growth', cycle)} style={{ width: '100%' }}>Choose Plan</Button>
                                </View>
                            </Card.Actions>
                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>What’s included:</Text>
                                {growthFeatures.map((f, i) => (
                                    <Feature key={i}>{f}</Feature>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Pro */}
                    <View style={[{ width: '100%', paddingTop: isMobile ? 0 : 54 }, !isMobile && { maxWidth: 300 }]}>
                        <Card style={{ flex: 1, padding: isMobile ? 12 : 20 }}>
                            <Card.Content style={{ gap: 4 }}>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>Pro</Text>
                                <Price plan="pro" c={cycle} />
                                <Text style={{ marginTop: 8, fontSize: 16 }}>Unlimited scale, end‑to‑end support, recovery safety net.</Text>
                            </Card.Content>

                            <Card.Actions>
                                <View style={{ width: '100%', marginTop: 16 }}>
                                    <Button mode="outlined" onPress={() => openPurchase('pro', cycle)} style={{ width: '100%' }}>Choose Plan</Button>
                                </View>
                            </Card.Actions>

                            <Card.Content style={{ marginTop: 24 }}>
                                <Text style={{ marginBottom: 12, fontWeight: 600 }}>What’s included:</Text>
                                {proFeatures.map((f, i) => (
                                    <Feature key={i}>{f}</Feature>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>
                </View>

                {/* Contact Support */}
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                    <Text variant="titleLarge">Need help choosing?</Text>
                    <Text style={{ marginTop: 10, fontSize: 16, textAlign: 'center' }}>
                        I’m here to help. Email: support@trendly.now
                    </Text>
                </View>
            </ScrollView>

            {/* Overlay while redirecting */}
            {linkKeyPending && (
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