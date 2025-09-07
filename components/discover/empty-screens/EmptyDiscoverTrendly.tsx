import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

export default function EmptyTrendlyInternalSelected() {
    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="star" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Trendly Pro: Micro-Influencer Discovery for Startups</Text>
                    <Text style={styles.stat}>30,000+ active Indian micro-influencers (under 50k followers)</Text>
                    <Text style={styles.detail}>• Only <Text style={{ fontWeight: 'bold' }}>₹1,500/month</Text> – designed for early-stage brands</Text>
                    <Text style={styles.detail}>• Barter or paid collaborations supported</Text>
                    <Text style={styles.detail}>• No global clutter, just Indian growth</Text>
                    <Text style={styles.testimonial}>“We found our first 100 true fans with Trendly Pro.”</Text>
                    <Button mode="contained" style={styles.button}>Unlock All Micro-Influencers with Pro</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 36, flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center' },
    card: { elevation: 4, borderRadius: 10 },
    title: { fontSize: 20, marginVertical: 8, textAlign: 'center' },
    stat: { fontSize: 17, fontWeight: 'bold', color: '#0e5b4d', marginVertical: 8, textAlign: 'center' },
    detail: { fontSize: 15, marginVertical: 2, textAlign: 'center' },
    testimonial: { fontStyle: 'italic', color: '#606772', marginVertical: 16, textAlign: 'center' },
    avatar: { backgroundColor: '#ffd600', alignSelf: 'center', marginBottom: 12 },
    button: { backgroundColor: '#3778f4', marginTop: 14 },
});
