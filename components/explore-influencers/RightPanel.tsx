import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { Platform, ScrollView, StyleSheet } from 'react-native'
import { Badge, Button, List, Surface, Text } from 'react-native-paper'

// A compact, elegant right sidebar inspired by modern dashboards
// Uses Surface instead of Card for lighter, cleaner blocks

const SectionHeader = ({ icon, title, subtitle }: { icon: keyof typeof FontAwesome.glyphMap, title: string, subtitle?: string }) => {
    const theme = useTheme()
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

const Block: React.FC<React.PropsWithChildren<{ style?: any }>> = ({ children, style }) => (
    <Surface elevation={1} style={[styles.surface, style]}> {children} </Surface>
)

const RightPanel = () => {
    const theme = useTheme()
    const router = useRouter()

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

                {/* Search helpers */}
                <Block>
                    <SectionHeader icon="search" title="Search influencers" subtitle="Find the right match" />
                    <Text variant="bodyMedium" style={styles.muted}>
                        Use filters to narrow by name, category, and more.
                    </Text>

                    {/* <View style={styles.chipsRow}>
                        <Chip compact icon="magnify">Text search</Chip>
                        <Chip compact icon="shape">Category</Chip>
                        <Chip compact icon="map-marker">Location</Chip>
                    </View> */}
                    {/* 
                    <Divider style={styles.divider} />
                    <Button
                        mode="contained-tonal"
                        icon="filter"
                        onPress={() => router.push('/explore-influencers')}
                        style={styles.ctaBtn}
                    >
                        Open search
                    </Button> */}
                </Block>



                {/* Influencer Preference */}
                <Block>
                    <SectionHeader icon="sliders" title="Influencer preference" subtitle="Advanced filters" />
                    <Text variant="bodyMedium" style={styles.muted}>
                        Want more control? Set your preferred audience size, platforms, languages, and budget.
                    </Text>

                    <List.Section style={styles.listSection}>
                        <List.Item
                            title="Audience size"
                            titleStyle={styles.listTitle}
                            description="Micro, Mid, Macro"
                            left={() => <FontAwesome name="users" size={16} color={Colors(theme).text} style={styles.listIcon} />}
                            right={() => <FontAwesome name="chevron-right" size={14} color={Colors(theme).text + '99'} />}
                            style={styles.listItem}
                        />
                        <List.Item
                            title="Platforms"
                            titleStyle={styles.listTitle}
                            description="Instagram, YouTube, more"
                            left={() => <FontAwesome name="hashtag" size={16} color={Colors(theme).text} style={styles.listIcon} />}
                            right={() => <FontAwesome name="chevron-right" size={14} color={Colors(theme).text + '99'} />}
                            style={styles.listItem}
                        />
                        <List.Item
                            title="Languages & budget"
                            titleStyle={styles.listTitle}
                            description="Pick your targets"
                            left={() => <FontAwesome name="globe" size={16} color={Colors(theme).text} style={styles.listIcon} />}
                            right={() => <FontAwesome name="chevron-right" size={14} color={Colors(theme).text + '99'} />}
                            style={styles.listItem}
                        />
                    </List.Section>

                    <Button mode="outlined" icon="tune" onPress={() => router.push('/preferences')}>
                        Set preferences
                    </Button>
                </Block>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
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
})

export default RightPanel