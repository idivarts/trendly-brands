import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, DataTable } from 'react-native-paper';

const databases = [
    {
        key: 'trendly',
        title: "Trendly",
        description: "30,000+ Indian micro-influencers. Built for startups. Included in Pro (₹1,500/mo).",
        icon: "star",
    },
    {
        key: 'phyllo',
        title: "Phyllo",
        description: "250M+ global creators. Enterprise reach at a fraction of direct cost.",
        icon: "earth",
    },
    {
        key: 'modash',
        title: "Modash",
        description: "250M+ creators. Perfect for scale and niche targeting.",
        icon: "flash",
    }
];

export default function EmptyNoDatabaseSelected() {
    return (
        <View style={styles.container}>
            <LinearGradient colors={["#eef2ff", "#fdf2f8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <Text style={styles.bannerTitle}>Discover Influencers Your Way</Text>
                <Text style={styles.bannerSubtitle}>Pick a database that matches your goals, budget, and stage</Text>
                <View style={styles.pillsRow}>
                    <View style={styles.pill}><Text style={styles.pillText}>Micro‑influencers</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Advanced Filters</Text></View>
                    <View style={styles.pill}><Text style={styles.pillText}>Best Pricing</Text></View>
                </View>
            </LinearGradient>

            <Text style={styles.subtext}>Choose a database to start exploring the perfect creators for your campaign.</Text>

            <View style={styles.cardRow}>
                {databases.map(db => (
                    <Card style={styles.card} key={db.key}>
                        <Card.Content>
                            <Avatar.Icon icon={db.icon} size={36} style={styles.avatar} />
                            <Text style={styles.cardTitle}>{db.title}</Text>
                            <Text style={styles.cardDescription}>{db.description}</Text>
                        </Card.Content>
                    </Card>
                ))}
            </View>

            <DataTable style={styles.table}>
                <DataTable.Header>
                    <DataTable.Title>Database</DataTable.Title>
                    <DataTable.Title>Size</DataTable.Title>
                    <DataTable.Title>Plan</DataTable.Title>
                    <DataTable.Title>Influencers</DataTable.Title>
                    <DataTable.Title>Socials</DataTable.Title>
                    <DataTable.Title>Best For</DataTable.Title>
                </DataTable.Header>
                <DataTable.Row>
                    <DataTable.Cell>Trendly</DataTable.Cell>
                    <DataTable.Cell>30k+</DataTable.Cell>
                    <DataTable.Cell>Pro</DataTable.Cell>
                    <DataTable.Cell>Upto 100k Fol.</DataTable.Cell>
                    <DataTable.Cell>Instagram</DataTable.Cell>
                    <DataTable.Cell>Startups</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Phyllo</DataTable.Cell>
                    <DataTable.Cell>250M+</DataTable.Cell>
                    <DataTable.Cell>Enterprise</DataTable.Cell>
                    <DataTable.Cell>All ranges</DataTable.Cell>
                    <DataTable.Cell>All Socials</DataTable.Cell>
                    <DataTable.Cell>Global</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Modash</DataTable.Cell>
                    <DataTable.Cell>250M+</DataTable.Cell>
                    <DataTable.Cell>Enterprise</DataTable.Cell>
                    <DataTable.Cell>Micro</DataTable.Cell>
                    <DataTable.Cell>All Socials</DataTable.Cell>
                    <DataTable.Cell>Niche/Scale</DataTable.Cell>
                </DataTable.Row>
            </DataTable>

            <Text style={styles.tip}>Tip: Not sure? Start with Trendly’s curated micro‑influencer pool.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#f8f9ff', flex: 1 },
    banner: { borderRadius: 16, paddingVertical: 22, paddingHorizontal: 16, marginBottom: 12 },
    bannerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2 },
    bannerSubtitle: { color: '#4b5563', marginTop: 6, textAlign: 'center' },
    pillsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    pill: { backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginHorizontal: 4, marginVertical: 4 },
    pillText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    subtext: { color: '#555', marginTop: 8, marginBottom: 24, textAlign: 'center', lineHeight: 20 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    card: { flex: 1, marginHorizontal: 6, elevation: 3, borderRadius: 12, paddingVertical: 6 },
    avatar: { backgroundColor: '#ececec', alignSelf: 'center', marginBottom: 10 },
    tip: { marginTop: 18, fontStyle: 'italic', color: '#666', textAlign: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '700', marginTop: 6, marginBottom: 2, textAlign: 'center', lineHeight: 24 },
    cardDescription: { fontSize: 15, color: '#444', textAlign: 'center', lineHeight: 20 },
    table: { borderRadius: 12, overflow: 'hidden', marginTop: 6 },
});
