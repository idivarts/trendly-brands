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
            <Text style={styles.title}>Discover Influencers Your Way</Text>
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
            <DataTable>
                <DataTable.Header>
                    <DataTable.Title>Database</DataTable.Title>
                    <DataTable.Title>Size</DataTable.Title>
                    <DataTable.Title>Plan</DataTable.Title>
                    <DataTable.Title>Price</DataTable.Title>
                    <DataTable.Title>Best For</DataTable.Title>
                </DataTable.Header>
                <DataTable.Row>
                    <DataTable.Cell>Trendly</DataTable.Cell>
                    <DataTable.Cell>30,000</DataTable.Cell>
                    <DataTable.Cell>Pro</DataTable.Cell>
                    <DataTable.Cell>₹1,500</DataTable.Cell>
                    <DataTable.Cell>Startups</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Phyllo</DataTable.Cell>
                    <DataTable.Cell>250M+</DataTable.Cell>
                    <DataTable.Cell>Enterprise</DataTable.Cell>
                    <DataTable.Cell>₹10,000</DataTable.Cell>
                    <DataTable.Cell>Global</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                    <DataTable.Cell>Modash</DataTable.Cell>
                    <DataTable.Cell>250M+</DataTable.Cell>
                    <DataTable.Cell>Enterprise</DataTable.Cell>
                    <DataTable.Cell>₹10,000</DataTable.Cell>
                    <DataTable.Cell>Niche/Scale</DataTable.Cell>
                </DataTable.Row>
            </DataTable>
            <Text style={styles.tip}>Tip: Not sure? Start with Trendly’s curated micro-influencer pool.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
    subtext: { color: '#555', marginBottom: 24, textAlign: 'center' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    card: { flex: 1, marginHorizontal: 6, elevation: 3 },
    avatar: { backgroundColor: '#ececec', alignSelf: 'center', marginBottom: 10 },
    tip: { marginTop: 18, fontStyle: 'italic', color: '#666' },
    cardTitle: { fontSize: 18, fontWeight: '600', marginTop: 6, marginBottom: 2, textAlign: 'center' },
    cardDescription: { fontSize: 14, color: '#444', textAlign: 'center' },
});
