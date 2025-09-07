import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

export default function EmptyPhylloSelected() {
    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="earth" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Go Global with Phyllo Database</Text>
                    <Text style={styles.stat}>250M+ creators – complete global database via Trendly</Text>
                    <Text style={styles.detail}>• Advanced filters to reach any audience, anywhere</Text>
                    <Text style={styles.detail}>• <Text style={{ fontWeight: 'bold' }}>₹10,000/month</Text> – save 60%+ versus direct</Text>
                    <Text style={styles.detail}>• Ideal for scaling brands, advanced targeting, large budgets</Text>
                    <Text style={styles.note}>Requires Enterprise plan. Contact sales for demo.</Text>
                    <Button mode="contained" style={styles.button}>Upgrade to Enterprise & Expand Your Reach</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 36, flex: 1, backgroundColor: '#f5f7fa', justifyContent: 'center' },
    card: { elevation: 4, borderRadius: 10 },
    title: { fontSize: 20, marginVertical: 8 },
    stat: { fontSize: 17, fontWeight: 'bold', color: '#205391', marginVertical: 8 },
    detail: { fontSize: 15, marginVertical: 2 },
    note: { fontStyle: 'italic', color: '#7b889c', marginVertical: 16 },
    avatar: { backgroundColor: '#bee1ff', alignSelf: 'center', marginBottom: 12 },
    button: { backgroundColor: '#2c67fa', marginTop: 14 },
});
