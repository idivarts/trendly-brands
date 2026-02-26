import Colors from "@/shared-uis/constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from "@react-navigation/native";
import { Avatar, Button, Card } from 'react-native-paper';

const PHYLLO_LOGO = 'https://cdn.prod.website-files.com/624eb8b8eb3aed6e1e68a7d2/67bec48d648677a1ce18fe55_logo%20(2).svg';

export default function EmptyPhylloSelected() {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { padding: 36, flex: 1, backgroundColor: colors.emptyPhylloContainer, justifyContent: 'center' },
                banner: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
                brandLogo: { height: 20, width: "100%", alignSelf: 'center', marginBottom: 6 },
                bannerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: colors.white },
                bannerSubtitle: { textAlign: 'center', marginTop: 4, color: colors.white },
                card: { elevation: 4, borderRadius: 12 },
                title: { fontSize: 21, marginVertical: 8, textAlign: 'center', color: colors.text },
                stat: { fontSize: 17, fontWeight: 'bold', color: colors.emptyPhylloPrimary, marginVertical: 8, textAlign: 'center' },
                detail: { fontSize: 15, marginVertical: 2, textAlign: 'center', lineHeight: 22, color: colors.text },
                note: { fontStyle: 'italic', color: colors.emptyPhylloNote, marginVertical: 16, textAlign: 'center' },
                avatar: { backgroundColor: colors.emptyPhylloAvatar, alignSelf: 'center', marginBottom: 12 },
                button: { marginTop: 14, maxWidth: 400, alignSelf: "center" },
                compareRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
                compareCard: { flex: 1, borderWidth: 1, borderColor: colors.emptyPhylloCompareBorder, borderRadius: 12, padding: 12, backgroundColor: colors.transparent },
                compareCardHighlight: { flex: 1, borderWidth: 1, borderColor: colors.emptyPhylloCompareBorder, borderRadius: 12, padding: 12, backgroundColor: colors.emptyPhylloCompareHighlight },
                compareHeading: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: colors.emptyPhylloCompareHeading },
                comparePrice: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 4, color: colors.text },
                compareNote: { fontSize: 12, textAlign: 'center', color: colors.emptyPhylloCompareNote, marginTop: 2 },
                savingsPill: { alignSelf: 'center', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.emptyPhylloSavingsPill },
                savingsText: { fontSize: 12, fontWeight: '700', color: colors.emptyPhylloSavingsText },
                footnote: { fontSize: 12, color: colors.emptyPhylloCompareNote, textAlign: 'center', marginTop: 8, lineHeight: 16 },
            }),
        [colors]
    );
    const gradientColors = [colors.emptyPhylloGradient1, colors.emptyPhylloGradient2] as const;
    return (
        <View style={styles.container}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Image source={{ uri: PHYLLO_LOGO }} style={styles.brandLogo} resizeMode="contain" />
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
                    <Button mode="contained" style={styles.button} buttonColor={colors.emptyPhylloPrimary}
                        onPress={() => Linking.openURL("mailto:support@trendly.now")}
                    >Upgrade to Enterprise & Expand Your Reach</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

