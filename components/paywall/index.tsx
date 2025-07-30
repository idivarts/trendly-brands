import React from 'react'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import { Button, Card, Paragraph, Text, Title, useTheme } from 'react-native-paper'

const PayWallComponent = () => {
    const theme = useTheme()
    const { width } = useWindowDimensions()

    const isMobile = width < 600

    return (
        <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background }}>
            {/* Marketing Section */}
            <View style={{ marginBottom: 40 }}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 20 }}>
                    Try Trendly Risk-Free
                </Text>
                <Paragraph style={{ fontSize: 16, lineHeight: 24, marginBottom: 10 }}>
                    Enjoy a 3-day free trial. Cancel anytime within 3 days and you won’t be charged.
                </Paragraph>
                <Paragraph style={{ fontSize: 16, lineHeight: 24, marginBottom: 10 }}>
                    Get a 14-day money-back guarantee on all plans.
                </Paragraph>
            </View>

            {/* Pricing Section */}
            <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 20 }}>
                <Card style={{ flex: 1, padding: 20 }}>
                    <Card.Content>
                        <Title>Growth Plan</Title>
                        <Paragraph>₹499 / month</Paragraph>
                        <Paragraph style={{ marginTop: 10 }}>
                            • Complete access to the platform{'\n'}
                            • 5 collaborations/month{'\n'}
                            • Unlimited applications and hiring contracts
                        </Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained-tonal" onPress={() => { }}>Choose Growth</Button>
                    </Card.Actions>
                </Card>

                <Card style={{ flex: 1, padding: 20, borderWidth: 2, borderColor: theme.colors.primary }}>
                    <Card.Content>
                        <Title>Business Plan (Preferred)</Title>
                        <Paragraph>₹4999 / year</Paragraph>
                        <Paragraph style={{ marginTop: 10 }}>
                            • Everything in Growth Plan{'\n'}
                            • Unlimited posting{'\n'}
                            • Guaranteed influencer availability{'\n'}
                            • Fraud recovery support{'\n'}
                            • Fast-track support{'\n'}
                            • First hire assistance included
                        </Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained" onPress={() => { }}>Choose Business</Button>
                    </Card.Actions>
                </Card>
            </View>

            {/* Contact Support Section */}
            <View style={{ marginTop: 40 }}>
                <Card style={{ padding: 20 }}>
                    <Card.Content>
                        <Title>Need Help or Custom Plan?</Title>
                        <Paragraph style={{ marginTop: 10 }}>
                            If you have custom requirements or want to discuss anything before booking, feel free to reach out.
                        </Paragraph>
                        <Paragraph style={{ marginTop: 10, fontWeight: 'bold' }}>
                            Contact us at: support@trendly.now
                        </Paragraph>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    )
}

export default PayWallComponent