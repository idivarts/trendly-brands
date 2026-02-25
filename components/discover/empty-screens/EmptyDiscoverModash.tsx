import Colors from "@/shared-uis/constants/Colors";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from "@react-navigation/native";
import { Avatar, Button, Card } from 'react-native-paper';

const MODASH_LOGO = 'https://cdn.prod.website-files.com/5ef4691542433bca43839ceb/6839797ca1a594bbe217a8b9_img_hero_logo_modash.png';

export default function EmptyModashSelected() {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { padding: 36, flex: 1, backgroundColor: colors.emptyModashContainer, justifyContent: 'center' },
                banner: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
                brandLogo: { width: "100%", height: 20, alignSelf: 'center', marginBottom: 6 },
                bannerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: colors.white },
                bannerSubtitle: { textAlign: 'center', marginTop: 4, color: colors.white },
                card: { elevation: 4, borderRadius: 12 },
                title: { fontSize: 20, marginVertical: 8, textAlign: 'center', color: colors.text },
                stat: { fontSize: 17, fontWeight: 'bold', color: colors.emptyModashStat, marginVertical: 8, textAlign: 'center', lineHeight: 22 },
                detail: { fontSize: 15, marginVertical: 2, textAlign: 'center', lineHeight: 22, color: colors.text },
                note: { fontStyle: 'italic', color: colors.emptyModashNote, marginVertical: 16, textAlign: 'center' },
                avatar: { backgroundColor: colors.emptyModashAvatar, alignSelf: 'center', marginBottom: 12 },
                button: { marginTop: 14, maxWidth: 400, alignSelf: "center" },
                compareRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
                compareCard: { flex: 1, borderWidth: 1, borderColor: colors.emptyModashCompareBorder, borderRadius: 12, padding: 12, backgroundColor: colors.emptyModashCompareBg },
                compareCardHighlight: { flex: 1, borderWidth: 1, borderColor: colors.emptyModashCompareBorder, borderRadius: 12, padding: 12, backgroundColor: colors.emptyModashCompareHighlight },
                compareHeading: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: colors.emptyModashCompareHeading },
                comparePrice: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 4, color: colors.text },
                compareNote: { fontSize: 12, textAlign: 'center', color: colors.emptyModashCompareNote, marginTop: 2 },
                savingsPill: { alignSelf: 'center', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.emptyModashSavingsPill },
                savingsText: { fontSize: 12, fontWeight: '700', color: colors.emptyModashSavingsText },
                footnote: { fontSize: 12, color: colors.emptyModashCompareNote, textAlign: 'center', marginTop: 8, lineHeight: 16 },
            }),
        [colors]
    );
    const gradientColors = [colors.emptyModashGradient1, colors.emptyModashGradient2] as const;

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Image source={{ uri: MODASH_LOGO }} style={styles.brandLogo} resizeMode="contain" />
                <Text style={styles.bannerTitle}>Modash Enterprise</Text>
                <Text style={styles.bannerSubtitle}>Hyper‑niche discovery at global scale</Text>
            </LinearGradient>

            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="flash" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Hyper‑Niche Discovery with Modash Database</Text>
                    <Text style={styles.stat}>250M+ global influencers – advanced niche & location filters</Text>
                    <Text style={styles.detail}>• Reach any audience, from hyper‑local to international</Text>
                    <Text style={styles.detail}>• <Text style={{ fontWeight: 'bold' }}>₹10,000/month</Text> via Trendly (just 1/3rd the direct price!)</Text>
                    <Text style={styles.detail}>• Best for agencies, D2C brands, advanced marketers</Text>

                    <View style={styles.compareRow}>
                        <View style={styles.compareCard}>
                            <Text style={styles.compareHeading}>Direct (Modash)</Text>
                            <Text style={styles.comparePrice}>approx 40,000 / month</Text>
                            <Text style={styles.compareNote}>Platform monthly plan</Text>
                        </View>
                        <View style={styles.compareCardHighlight}>
                            <Text style={styles.compareHeading}>Via Trendly</Text>
                            <Text style={styles.comparePrice}>₹15,000 / month</Text>
                            <View style={styles.savingsPill}><Text style={styles.savingsText}>Save ~60%*</Text></View>
                        </View>
                    </View>
                    <Text style={styles.footnote}>* Based on Modash public pricing of $299/mo vs ₹10,000/mo via Trendly. Actual savings vary with currency and usage. Sources cited in UI copy.</Text>

                    <Text style={styles.note}>Enterprise required. Request onboarding to access.</Text>
                    <Button mode="contained" buttonColor={colors.emptyModashPrimary} style={styles.button}
                        onPress={() => Linking.openURL("mailto:support@trendly.now")}>Unlock Modash Access with Enterprise</Button>
                </Card.Content>
            </Card>
        </View>
    );
}
