import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';

export default function EmptyModashSelected() {
    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Avatar.Icon icon="flash" size={36} style={styles.avatar} />
                    <Text style={styles.title}>Hyper-Niche Discovery with Modash Database</Text>
                    <Text style={styles.stat}>250M+ global influencers – advanced niche & location filters</Text>
                    <Text style={styles.detail}>• Reach any audience, from hyper-local to international</Text>
                    <Text style={styles.detail}>• <Text style={{ fontWeight: 'bold' }}>₹10,000/month</Text> via Trendly (just 1/3rd the direct price!)</Text>
                    <Text style={styles.detail}>• Best for agencies, D2C brands, advanced marketers</Text>
                    <Text style={styles.note}>Enterprise required. Request onboarding to access.</Text>
                    <Button mode="contained" style={styles.button}>Unlock Modash Access with Enterprise</Button>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 36, flex: 1, backgroundColor: '#fff9f1', justifyContent: 'center' },
    card: { elevation: 4, borderRadius: 10 },
    title: { fontSize: 20, marginVertical: 8, textAlign: 'center' },
    stat: { fontSize: 17, fontWeight: 'bold', color: '#de8528', marginVertical: 8, textAlign: 'center' },
    detail: { fontSize: 15, marginVertical: 2, textAlign: 'center' },
    note: { fontStyle: 'italic', color: '#9c7b5f', marginVertical: 16, textAlign: 'center' },
    avatar: { backgroundColor: '#fff8e1', alignSelf: 'center', marginBottom: 12 },
    button: { backgroundColor: '#fa922c', marginTop: 14 },
});
