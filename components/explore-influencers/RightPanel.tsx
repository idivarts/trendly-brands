import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { FontAwesome } from '@expo/vector-icons'
import { useTheme } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button, Card, Chip, Divider, Text } from 'react-native-paper'

const RightPanel = () => {
    const theme = useTheme()
    const router = useRouter()

    return (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator horizontal={false}>
            <View style={styles.container}>
                {/* Search helpers */}
                <Card mode="elevated" style={styles.card}>
                    <Card.Title
                        title="Search influencers"
                        subtitle="Find the right match"
                        left={(props) => (
                            <FontAwesome name="search" size={20}
                                color={Colors(theme).text}
                                style={{ marginRight: 8 }} />
                        )}
                    />
                    <Card.Content style={styles.cardContent}>
                        <Text variant="bodyMedium" style={styles.muted}>
                            Use filters to narrow by name, category, and more.
                        </Text>
                        <View style={styles.chipsRow}>
                            <Chip compact icon="magnify">Text search</Chip>
                            <Chip compact icon="shape">Category</Chip>
                            <Chip compact icon="map-marker">Location</Chip>
                        </View>
                        <Divider style={styles.divider} />
                        <Button mode="contained-tonal" icon="filter" onPress={() => router.push('/explore-influencers')}>Open search</Button>
                    </Card.Content>
                </Card>

                {/* Create Campaign CTA with gradient accent */}
                <Card mode="elevated" style={styles.card}>
                    <LinearGradient
                        colors={[Colors(theme).primary, Colors(theme).secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientHeader}
                    >
                        <Text variant="titleMedium" style={styles.gradientTitle}>Create a Campaign</Text>
                        <Text variant="bodySmall" style={styles.gradientSubtitle}>Attract top creators with a clear brief.</Text>
                    </LinearGradient>
                    <Card.Content style={styles.cardContent}>
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
                    </Card.Content>
                </Card>

                {/* Influencer Preference */}
                <Card mode="elevated" style={styles.card}>
                    <Card.Title title="Influencer preference" subtitle="Advanced filters" left={(props) => (
                        <FontAwesome name="sliders" size={20} color={Colors(theme).text} style={{ marginRight: 8 }} />
                    )} />
                    <Card.Content style={styles.cardContent}>
                        <Text variant="bodyMedium" style={styles.muted}>
                            Want more control? Set your preferred audience size, platforms, languages, and budget.
                        </Text>
                        <Button mode="outlined" icon="tune" onPress={() => router.push('/preferences')}>
                            Set preferences
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1
    },
    container: {
        padding: 16,
        gap: 12,
        flex: 1
    },
    card: {
        overflow: 'hidden',
    },
    cardContent: {
        gap: 12,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
        marginBottom: 4,
    },
    divider: {
        marginVertical: 4,
        opacity: 0.3,
    },
    ctaBtn: {
        alignSelf: 'flex-start',
    },
    gradientHeader: {
        padding: 12,
    },
    gradientTitle: {
        color: 'white',
        fontWeight: '600',
        marginBottom: 2,
    },
    gradientSubtitle: {
        color: 'white',
        opacity: 0.9,
    },
    muted: {
        opacity: 0.8,
    },
})

export default RightPanel