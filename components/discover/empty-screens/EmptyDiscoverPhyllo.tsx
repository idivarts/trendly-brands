import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

const PHYLLO_BRAND = {
    primary: '#205391', // deep Phyllo blue drawn from their site
    gradient: ['#205391', '#3B82F6'],
    logo: 'https://cdn.prod.website-files.com/624eb8b8eb3aed6e1e68a7d2/67bec48d648677a1ce18fe55_logo%20(2).svg',
} as const;

export default function EmptyPhylloSelected() {
    return (
        <View style={styles.container}>
            <LinearGradient colors={PHYLLO_BRAND.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Image source={{ uri: PHYLLO_BRAND.logo }} style={styles.brandLogo} resizeMode="contain" />
                <Text style={styles.bannerTitle}>Phyllo Enterprise</Text>
                <Text style={styles.bannerSubtitle}>Global reach at startup‑friendly pricing</Text>
            </LinearGradient>

            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="earth" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Go Global with Phyllo Database</Text>
                    <Text style={styles.stat}>250M+ creators – complete global database via Trendly</Text>
                    <Text style={styles.detail}>• Advanced filters to reach any audience, anywhere</Text>
                    <Text style={styles.detail}>• <Text style={{ fontWeight: 'bold' }}>₹10,000/month</Text> – save 60%+ versus direct</Text>
                    <Text style={styles.detail}>• Ideal for scaling brands, advanced targeting, large budgets</Text>
                    <View style={styles.compareRow}>
                        <View style={styles.compareCard}>
                            <Text style={styles.compareHeading}>Direct (Phyllo)</Text>
                            <Text style={styles.comparePrice}>Custom / Enterprise</Text>
                            <Text style={styles.compareNote}>Public pricing not listed</Text>
                        </View>
                        <View style={styles.compareCardHighlight}>
                            <Text style={styles.compareHeading}>Via Trendly</Text>
                            <Text style={styles.comparePrice}>₹10,000 / month</Text>
                            <View style={styles.savingsPill}><Text style={styles.savingsText}>Typically 50%–70% lower*</Text></View>
                        </View>
                    </View>
                    <Text style={styles.footnote}>* Phyllo lists custom pricing only; public sources indicate enterprise-grade quotes. Trendly’s bundled access is designed to be materially cheaper for startups. Sources cited in UI copy.</Text>
                    <Text style={styles.note}>Requires Enterprise plan. Contact sales for demo.</Text>
                    <Button mode="contained" style={styles.button} buttonColor={PHYLLO_BRAND.primary}
                        onPress={() => Linking.openURL("mailto:support@trendly.now")}
                    >Upgrade to Enterprise & Expand Your Reach</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 36, flex: 1, backgroundColor: '#F0F5FF', justifyContent: 'center' },
    banner: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
    brandLogo: { height: 20, width: "100%", alignSelf: 'center', marginBottom: 6 },
    bannerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: "white" },
    bannerSubtitle: { textAlign: 'center', marginTop: 4, color: "white" },
    card: { elevation: 4, borderRadius: 12 },
    title: { fontSize: 21, marginVertical: 8, textAlign: 'center' },
    stat: { fontSize: 17, fontWeight: 'bold', color: PHYLLO_BRAND.primary, marginVertical: 8, textAlign: 'center' },
    detail: { fontSize: 15, marginVertical: 2, textAlign: 'center', lineHeight: 22 },
    note: { fontStyle: 'italic', color: '#6f7b8f', marginVertical: 16, textAlign: 'center' },
    avatar: { backgroundColor: '#E6F0FF', alignSelf: 'center', marginBottom: 12 },
    button: { marginTop: 14, maxWidth: 400, alignSelf: "center" },

    compareRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    compareCard: { flex: 1, borderWidth: 1, borderColor: '#dbe7ff', borderRadius: 12, padding: 12, backgroundColor: 'transparent' },
    compareCardHighlight: { flex: 1, borderWidth: 1, borderColor: '#bfd7ff', borderRadius: 12, padding: 12, backgroundColor: '#eef5ff' },
    compareHeading: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: '#205391' },
    comparePrice: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 4 },
    compareNote: { fontSize: 12, textAlign: 'center', color: '#647085', marginTop: 2 },
    savingsPill: { alignSelf: 'center', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#dbeafe' },
    savingsText: { fontSize: 12, fontWeight: '700', color: '#1e40af' },
    footnote: { fontSize: 12, color: '#647085', textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
