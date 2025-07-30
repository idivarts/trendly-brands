import React from 'react'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import { Button, Card, Chip, Paragraph, Text, Title, useTheme } from 'react-native-paper'

const PayWallComponent = () => {
    const theme = useTheme()
    const { width } = useWindowDimensions()

    const isMobile = width < 600

    return (
        <ScrollView contentContainerStyle={{ padding: isMobile ? 20 : 40, backgroundColor: theme.colors.background }}>
            {/* Marketing Section */}
            <View style={{ marginBottom: 40, alignItems: "center" }}>
                <Text variant="headlineLarge" style={{ fontWeight: 'bold', marginBottom: 20 }}>
                    Try Trendly Today
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <Chip icon="clock-fast" style={{ backgroundColor: theme.colors.secondaryContainer }}>
                        3-Day Free Trial
                    </Chip>
                    <Chip icon="cash-refund" style={{ backgroundColor: theme.colors.tertiaryContainer }}>
                        14-Day Money Back Guarantee
                    </Chip>
                </View>
            </View>

            {/* Pricing Section */}
            <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 60 }}>
                <View style={{ maxWidth: 400, width: '100%' }}>
                    <Card style={{ flex: 1, padding: 20 }}>
                        <Card.Content style={{ gap: 4 }}>
                            <Chip icon="check-circle" style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: theme.colors.backdrop }}>
                                For New Brands
                            </Chip>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                                Growth Plan
                            </Text>
                            <Paragraph style={{ fontSize: 22, marginBottom: 8 }}>
                                ₹<Text style={{ fontSize: 28 }}>499</Text> <Text style={{ fontWeight: 'bold' }}>/ month</Text>
                            </Paragraph>
                            <Paragraph style={{ marginTop: 8, fontSize: 16 }}>
                                Best for small teams getting started with collaborations.
                            </Paragraph>
                        </Card.Content>
                        <Card.Actions>
                            <View style={{ width: '100%' }}>
                                <Button mode="contained-tonal" onPress={() => { }} style={{ width: '100%' }}>Choose Growth</Button>
                            </View>
                        </Card.Actions>
                        <Card.Content>
                            <Paragraph style={{ marginTop: 10, fontSize: 18, lineHeight: 26 }}>
                                • Complete access to the platform{'\n'}
                                • 5 collaborations/month{'\n'}
                                • Unlimited applications and hiring contracts
                            </Paragraph>
                        </Card.Content>

                    </Card>
                </View>

                <View style={{ maxWidth: 400, width: '100%' }}>
                    <Card style={{ flex: 1, padding: 20, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }}>
                        <Card.Content style={{ gap: 4 }}>
                            <Chip icon="check-circle" style={{ alignSelf: 'flex-start', marginBottom: 10, backgroundColor: theme.colors.secondaryContainer }}>
                                Preferred
                            </Chip>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer, marginBottom: 12 }}>
                                Business Plan
                            </Text>
                            <Paragraph style={{ fontSize: 22, color: theme.colors.onPrimaryContainer, marginBottom: 8 }}>
                                ₹ <Text style={{ fontSize: 28, color: theme.colors.onPrimaryContainer }}>4,999</Text> <Text style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>/ year</Text>
                            </Paragraph>
                            <Paragraph style={{ marginTop: 8, fontSize: 16, color: theme.colors.onPrimaryContainer }}>
                                Ideal for established businesses scaling influencer marketing.
                            </Paragraph>
                        </Card.Content>
                        <Card.Actions>
                            <View style={{ width: '100%' }}>
                                <Button mode="contained" onPress={() => { }} style={{ width: '100%' }}>Choose Business</Button>
                            </View>
                        </Card.Actions>
                        <Card.Content>
                            <Paragraph style={{ marginTop: 10, fontSize: 18, lineHeight: 26, color: theme.colors.onPrimaryContainer }}>
                                • Everything in Growth Plan{'\n'}
                                • Unlimited posting{'\n'}
                                • Guaranteed influencer availability{'\n'}
                                • Fraud recovery support{'\n'}
                                • Fast-track support{'\n'}
                                • First hire assistance included
                            </Paragraph>
                        </Card.Content>


                    </Card>
                </View>
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