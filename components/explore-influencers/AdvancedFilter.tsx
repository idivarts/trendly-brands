import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { FontAwesome } from '@expo/vector-icons'
import { Theme, useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { default as React } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { Badge, Divider, Text } from 'react-native-paper'
import Button from '../ui/button'
import { Block } from './RightPanel'


const AdvancedFilter = () => {
    const theme = useTheme()

    const styles = stylesFn(theme)

    return (
        <Block style={{ padding: 0, borderWidth: 0 }}>
            <LinearGradient
                colors={[Colors(theme).secondary, Colors(theme).primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.comingSoonCard}
            >
                <View style={styles.headerRow}>
                    <View style={[styles.headerIconWrap]}>
                        <FontAwesome name="search" size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1, backgroundColor: "transparent" }}>
                        <Text variant="titleSmall" style={styles.soonTitle}>Advanced Filter</Text>
                        <Text variant="labelSmall" style={styles.soonSubtitle}>Powerful ways to find creators</Text>
                    </View>
                    <Badge size={18} style={styles.soonBadge}>Locked</Badge>
                </View>
                <Divider style={{ marginVertical: 16 }} />

                <View style={styles.soonList}>
                    <View style={styles.soonListItem}>
                        <View style={styles.soonBulletIcon}><FontAwesome name="user" size={14} color="#fff" /></View>
                        <View style={{ flex: 1, backgroundColor: "transparent" }}>
                            <Text variant="labelLarge" style={styles.soonListTitle}>Search by creator name</Text>
                            <Text variant="bodySmall" style={styles.soonListDesc}>Know a creator already? Just type their name.</Text>
                        </View>
                    </View>

                    <View style={styles.soonListItem}>
                        <View style={styles.soonBulletIcon}><FontAwesome name="tag" size={14} color="#fff" /></View>
                        <View style={{ flex: 1, backgroundColor: "transparent" }}>
                            <Text variant="labelLarge" style={styles.soonListTitle}>Keyword search</Text>
                            <Text variant="bodySmall" style={styles.soonListDesc}>Find influencers by content keywords like “fashion” or “GRWM”.</Text>
                        </View>
                    </View>

                    <View style={styles.soonListItem}>
                        <View style={styles.soonBulletIcon}><FontAwesome name="magic" size={14} color="#fff" /></View>
                        <View style={{ flex: 1, backgroundColor: "transparent" }}>
                            <Text variant="labelLarge" style={styles.soonListTitle}>Look‑alike search</Text>
                            <Text variant="bodySmall" style={styles.soonListDesc}>Paste a creator’s link and our AI finds similar vibes, style, and audience.</Text>
                        </View>
                    </View>
                </View>

                <Button
                    mode="contained"
                    buttonColor="#fff"
                    labelStyle={{ color: Colors(theme).primary, fontWeight: '600' }}
                    style={styles.soonCtaBtn}
                    icon={() => <FontAwesome name="arrow-right" size={14} color={Colors(theme).primary} />}
                    onPress={() => router.push('/billing')}
                >
                    Upgrade to Pro
                </Button>

                <Text variant="labelSmall" style={styles.soonFootnote}>
                    Register on the yearly plan today. When search launches, any price hike won’t affect your current plan.
                </Text>
            </LinearGradient>
        </Block>

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
        borderColor: Colors(theme).border,
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
        backgroundColor: Colors(theme).transparent
    },

    comingSoonCard: {
        borderRadius: 14,
        padding: 14,
        overflow: 'hidden',
    },
    soonBadge: {
        backgroundColor: Colors(theme).background,
        color: Colors(theme).textSecondary,
    },
    soonTitle: {
        color: Colors(theme).white,
        fontWeight: '700',
    },
    soonSubtitle: {
        color: Colors(theme).gray200,
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
        backgroundColor: Colors(theme).transparent,
    },
    soonListTitle: {
        color: Colors(theme).white,
        fontWeight: '600',
    },
    soonListDesc: {
        color: Colors(theme).gray200,
    },
    soonCtaBtn: {
        alignSelf: 'flex-start',
        marginTop: 24,
    },
    soonFootnote: {
        color: Colors(theme).gray200,
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


export default AdvancedFilter