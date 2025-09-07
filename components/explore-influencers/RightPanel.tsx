import { useBrandContext } from '@/contexts/brand-context.provider'
import { useMyNavigation } from '@/shared-libs/utils/router'
import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { FontAwesome } from '@expo/vector-icons'
import { Theme, useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Platform, ScrollView, StyleSheet } from 'react-native'
import { Badge, Button, Divider, SegmentedButtons, Surface, Text } from 'react-native-paper'

// A compact, elegant right sidebar inspired by modern dashboards
// Uses Surface instead of Card for lighter, cleaner blocks

const SectionHeader = ({ icon, title, subtitle }: { icon: keyof typeof FontAwesome.glyphMap, title: string, subtitle?: string }) => {
    const theme = useTheme()
    const styles = stylesFn(theme)
    return (
        <View style={styles.headerRow}>
            <View style={[styles.headerIconWrap, { backgroundColor: Colors(theme).card + '33' }]}>
                <FontAwesome name={icon} size={16} color={Colors(theme).text} />
            </View>
            <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={styles.headerTitle}>{title}</Text>
                {subtitle ? <Text variant="labelSmall" style={styles.headerSubtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    )
}

export const Block: React.FC<React.PropsWithChildren<{ style?: any }>> = ({ children, style }) => {
    const theme = useTheme()
    const styles = stylesFn(theme)

    return (
        <Surface elevation={1} style={[styles.surface, style]}> {children} </Surface>
    )
}

interface IProps {
    connectedInfluencers: boolean,
    setConnectedInfluencers: Function
}
const RightPanel: React.FC<IProps> = ({ connectedInfluencers, setConnectedInfluencers }) => {
    const theme = useTheme()
    const styles = stylesFn(theme)
    const router = useMyNavigation()

    const { selectedBrand } = useBrandContext()
    const planKey = selectedBrand?.billing?.planKey
    const isLocked = planKey != "pro" && planKey != "enterprise"

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            horizontal={false}
        >
            <View style={styles.container}>
                {/* Create Campaign CTA with soft gradient ribbon */}
                <Block>
                    <LinearGradient
                        colors={[Colors(theme).primary, Colors(theme).secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.ribbon}
                    >
                        <FontAwesome name="bullhorn" size={14} color="#fff" />
                        <Text variant="labelLarge" style={styles.ribbonText}>Create a Campaign</Text>
                        <Badge size={18} style={styles.ribbonBadge}>New</Badge>
                    </LinearGradient>

                    <Text variant="bodyMedium" style={styles.muted}>
                        Campaigns are the best way to invite influencer talent to work with your brand.
                    </Text>

                    <Button
                        mode="contained"
                        icon="bullhorn"
                        style={styles.ctaBtn}
                        onPress={() => router.push('/create-collaboration')}
                    >
                        Create campaign
                    </Button>
                </Block>

                {/* Explore vs Connected switch */}
                <Block>
                    <SectionHeader
                        icon={connectedInfluencers ? 'link' : 'compass'}
                        title={connectedInfluencers ? 'Connected influencers' : 'Explore influencers'}
                        subtitle={connectedInfluencers ? 'See the creators already in touch with your brand' : 'Browse and discover new creators that match your vibe'}
                    />
                    <SegmentedButtons
                        value={connectedInfluencers ? 'connected' : 'explore'}
                        onValueChange={(v) => setConnectedInfluencers(v === 'connected')}
                        buttons={[
                            {
                                value: 'explore',
                                label: 'Explore',
                                icon: 'magnify',
                                style: connectedInfluencers ? styles.segmentBtn : styles.segmentBtnActive,
                            },
                            {
                                value: 'connected',
                                label: 'Connected',
                                icon: 'link-variant',
                                style: !connectedInfluencers ? styles.segmentBtn : styles.segmentBtnActive,
                            },
                        ]}
                        density="regular"
                        style={styles.segmentGroup}
                    />
                </Block>

                {/* Influencer Preference */}
                <Block>
                    <SectionHeader icon="sliders" title="Influencer preference"
                        subtitle="Want more control? You can set some common preferences in Brand Preferences section." />
                    <Button mode="outlined" icon="tune" onPress={() => router.push('/preferences')}>
                        Set preferences
                    </Button>
                </Block>

                {/* Search helpers */}
                <Block style={{ padding: 0, borderWidth: 0 }}>
                    <LinearGradient
                        colors={[Colors(theme).secondary, Colors(theme).primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.comingSoonCard}
                    >
                        <View style={styles.headerRow}>
                            <View style={[styles.headerIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                                <FontAwesome name="search" size={16} color="#fff" />
                            </View>
                            <View style={{ flex: 1, backgroundColor: "transparent" }}>
                                <Text variant="titleSmall" style={styles.soonTitle}>Advanced Discovery</Text>
                                <Text variant="labelSmall" style={styles.soonSubtitle}>Powerful ways to find creators</Text>
                            </View>
                            {isLocked &&
                                <Badge size={18} style={styles.soonBadge}>Locked</Badge>}
                        </View>
                        <Divider style={{ marginVertical: 16 }} />

                        <View style={styles.soonList}>
                            <View style={styles.soonListItem}>
                                <View style={styles.soonBulletIcon}><FontAwesome name="magic" size={14} color="#fff" /></View>
                                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                    <Text variant="labelLarge" style={styles.soonListTitle}>Laser‑targeted filters</Text>
                                    <Text variant="bodySmall" style={styles.soonListDesc}>Filter by followers, engagement, verification, niche, location and more.</Text>
                                </View>
                            </View>

                            <View style={styles.soonListItem}>
                                <View style={styles.soonBulletIcon}><FontAwesome name="tag" size={14} color="#fff" /></View>
                                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                    <Text variant="labelLarge" style={styles.soonListTitle}>Keyword & look‑alike search</Text>
                                    <Text variant="bodySmall" style={styles.soonListDesc}>Match bios by keywords or paste a profile to find similar creators.</Text>
                                </View>
                            </View>

                            <View style={styles.soonListItem}>
                                <View style={styles.soonBulletIcon}><FontAwesome name="bolt" size={14} color="#fff" /></View>
                                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                                    <Text variant="labelLarge" style={styles.soonListTitle}>Save time, scale faster</Text>
                                    <Text variant="bodySmall" style={styles.soonListDesc}>Skip manual sorting and discover perfect fits instantly.</Text>
                                </View>
                            </View>
                        </View>


                        {isLocked && <>
                            <Button
                                mode="contained"
                                buttonColor="#fff"
                                labelStyle={{ color: Colors(theme).primary, fontWeight: '600' }}
                                style={styles.soonCtaBtn}
                                icon={() => <FontAwesome name="arrow-right" size={14} color={Colors(theme).primary} />}
                                onPress={() => router.push('/billing')}
                            >
                                Updrage to Pro
                            </Button>

                            <Text variant="labelSmall" style={styles.soonFootnote}>
                                Register on the yearly plan today. When search launches, any price hike won’t affect your current plan.
                            </Text>
                        </>}
                        {!isLocked && <>
                            <Button
                                mode="contained"
                                buttonColor="#fff"
                                labelStyle={{ color: Colors(theme).primary, fontWeight: '600' }}
                                style={styles.soonCtaBtn}
                                icon={() => <FontAwesome name="arrow-right" size={14} color={Colors(theme).primary} />}
                                onPress={() => router.push('/discover')}
                            >
                                Go to Discovery Page
                            </Button>

                            <Text variant="labelSmall" style={styles.soonFootnote}>
                                Access a pool of over 30k internal influencer database and a pool of over 250+ million influencers to search from
                            </Text>
                        </>}

                    </LinearGradient>
                </Block>

            </View>
        </ScrollView>
    )
}

const stylesFn = (theme: Theme) => StyleSheet.create({
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 8,
    },
    container: {
        padding: 12,
        gap: 10,
        flex: 1,
    },
    surface: {
        borderRadius: 14,
        padding: 12,
        overflow: 'hidden',
        // Subtle outline for elegance
        borderWidth: Platform.select({ web: 1, default: 0 }),
        borderColor: 'rgba(0,0,0,0.06)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
        backgroundColor: "transparent"
    },
    headerIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '600',
    },
    headerSubtitle: {
        opacity: 0.7,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    divider: {
        marginVertical: 6,
        opacity: 0.25,
    },
    ctaBtn: {
        alignSelf: 'flex-start',
    },
    ribbon: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    ribbonText: {
        color: 'white',
        fontWeight: '600',
        flex: 1,
    },
    ribbonBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white',
    },
    muted: {
        opacity: 0.85,
        marginVertical: 16,
    },
    listSection: {
        marginTop: 6,
        marginBottom: 2,
    },
    listItem: {
        paddingHorizontal: 0,
        minHeight: 40,
    },
    listTitle: {
        fontSize: 13,
    },
    listIcon: {
        marginRight: 12,
        width: 18,
        textAlign: 'center',
    },
    comingSoonCard: {
        borderRadius: 14,
        padding: 14,
        overflow: 'hidden',
    },
    soonBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white',
    },
    soonTitle: {
        color: '#fff',
        fontWeight: '700',
    },
    soonSubtitle: {
        color: 'rgba(255,255,255,0.85)',
    },
    soonList: {
        marginTop: 6,
        gap: 10,
        backgroundColor: "transparent"
    },
    soonListItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: "transparent"
    },
    soonBulletIcon: {
        width: 26,
        height: 26,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    soonListTitle: {
        color: '#fff',
        fontWeight: '600',
    },
    soonListDesc: {
        color: 'rgba(255,255,255,0.9)',
    },
    soonCtaBtn: {
        alignSelf: 'flex-start',
        marginTop: 24,
    },
    soonFootnote: {
        color: 'rgba(255,255,255,0.85)',
        marginTop: 10,
    },
    segmentGroup: {
        marginTop: 4,
    },
    segmentBtn: {
        // keep it subtle and premium-looking
    },
    segmentBtnActive: {
        backgroundColor: Colors(theme).primary
    },
})

export default RightPanel