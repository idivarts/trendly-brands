import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

export default function EmptyTrendlyInternalSelected() {
    return (
        <View style={styles.container}>
            <LinearGradient colors={["#e6fffb", "#f0f9ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Text style={styles.bannerTitle}>Trendly Pro</Text>
                <Text style={styles.bannerSubtitle}>Built for lean teams that move fast</Text>
            </LinearGradient>

            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="star" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Micro‑Influencer Discovery for Startups</Text>
                    <Text style={styles.stat}>30,000+ active Indian micro‑influencers (under 50k followers)</Text>
                    <Text style={styles.detail}>• Only <Text style={{ fontWeight: 'bold' }}>₹1,500/month</Text> – designed for early‑stage brands</Text>
                    <Text style={styles.detail}>• Barter and paid collaborations supported</Text>
                    <Text style={styles.detail}>• Clean, India‑first results. Zero global noise</Text>
                    <Text style={styles.detail}>• Built‑in lead capture, shortlists, and campaign boards</Text>
                    <Text style={styles.detail}>• Priority support for founders: fast onboarding, faster results</Text>
                    <Text style={styles.testimonial}>“We found our first 100 true fans with Trendly Pro.”</Text>
                    <Button mode="contained" style={styles.button} buttonColor="#3778f4">Unlock All Micro‑Influencers with Pro</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 36, flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center' },
    banner: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
    bannerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    bannerSubtitle: { textAlign: 'center', color: '#0e5b4d', marginTop: 4 },
    card: { elevation: 4, borderRadius: 12, paddingBottom: 6 },
    title: { fontSize: 20, marginVertical: 8, textAlign: 'center' },
    stat: { fontSize: 17, fontWeight: 'bold', color: '#0e5b4d', marginVertical: 8, textAlign: 'center', lineHeight: 22 },
    detail: { fontSize: 15, marginVertical: 2, textAlign: 'center', lineHeight: 22 },
    testimonial: { fontStyle: 'italic', color: '#606772', marginVertical: 16, textAlign: 'center' },
    avatar: { backgroundColor: '#ffd600', alignSelf: 'center', marginBottom: 12 },
    button: { marginTop: 14 },
});
