import React from 'react'
import { ScrollView, Text } from 'react-native'

const TermsAndCondition = () => {
    return (
        // <View style={{ display: "flex", flex:1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }} style={{ flex: 1, height: "100%", marginBottom: 20, overflow: "hidden" }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Terms & Conditions / End User License Agreement (EULA)</Text>

            <Text style={{ marginBottom: 10 }}>
                Welcome to Trendly. These Terms and Conditions ("Terms") constitute a legally binding agreement between your organization and iDiv Technologies ("we", "us", or "our"), the company behind Trendly. These Terms specifically apply to brands and their authorized representatives who register or use Trendly for managing collaborations.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>1. Acceptance of Terms</Text>
            <Text style={{ marginBottom: 10 }}>
                By registering your brand or using Trendly, you and your authorized representatives agree to be bound by these Terms and our Privacy Policy. If you do not agree with these, do not use the app.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>2. Brand Content and Responsibilities</Text>
            <Text style={{ marginBottom: 10 }}>
                Brands and their representatives may create collaboration listings, communicate with creators, and manage campaigns. All submitted content must be professional and must not include offensive, misleading, or unlawful material. Brands are solely responsible for the content they publish and share.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>3. Content Moderation and Reporting</Text>
            <Text style={{ marginBottom: 10 }}>
                Trendly includes moderation tools to ensure a safe and professional environment for all users. Trendly reserves the right to:
                {'\n'}- Flag misleading or inappropriate brand content.
                {'\n'}- Temporarily or permanently restrict accounts posting abusive or unprofessional content.
                {'\n'}All flagged brand content will be reviewed within 24 hours and acted upon according to our guidelines.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>4. Advertising and Promotions</Text>
            <Text style={{ marginBottom: 10 }}>
                By registering with Trendly, your brand grants us the right to showcase and promote your public listings and brand name (excluding sensitive or private data) on our website, promotional materials, and social media campaigns. You may request exclusion by contacting our support team.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>5. License</Text>
            <Text style={{ marginBottom: 10 }}>
                We grant your brand a limited, non-exclusive, non-transferable, revocable license to use the Trendly app for business use related to influencer collaborations, subject to these Terms.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>6. Termination</Text>
            <Text style={{ marginBottom: 10 }}>
                We reserve the right to suspend or terminate your account and access to Trendly if you breach these Terms or engage in abusive or harmful behavior.
                This includes violations by brand representatives or misuse of collaboration tools and communication features.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>7. Changes to Terms</Text>
            <Text style={{ marginBottom: 10 }}>
                We reserve the right to update these Terms at any time. Continued use of the app after changes indicates acceptance.
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>8. Contact Us</Text>
            <Text style={{ marginBottom: 20 }}>
                If you have any questions or concerns about these Terms or wish to report content, please contact us at support@trendly.now.
            </Text>
        </ScrollView>
        // </View>
    )
}

export default TermsAndCondition