import { fs, lh } from '@/constants/Typography'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import React from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'

const TermsAndCondition = () => {
    const theme = useTheme()
    const colors = Colors(theme)
    const styles = useStyles(colors)

    return (
        <ScrollView contentContainerStyle={styles.content} style={styles.container}>
            <Text style={styles.title}>Terms & Conditions / End User License Agreement (EULA)</Text>

            <Text style={styles.body}>
                Welcome to Trendly. These Terms and Conditions ("Terms") constitute a legally binding agreement between your organization and iDiv Technologies ("we", "us", or "our"), the company behind Trendly. These Terms specifically apply to brands and their authorized representatives who register or use Trendly for managing collaborations.
            </Text>

            <Text style={styles.heading}>1. Acceptance of Terms</Text>
            <Text style={styles.body}>
                By registering your brand or using Trendly, you and your authorized representatives agree to be bound by these Terms and our Privacy Policy. If you do not agree with these, do not use the app.
            </Text>

            <Text style={styles.heading}>2. Brand Content and Responsibilities</Text>
            <Text style={styles.body}>
                Brands and their representatives may create collaboration listings, communicate with creators, and manage campaigns. All submitted content must be professional and must not include offensive, misleading, or unlawful material. Brands are solely responsible for the content they publish and share.
            </Text>

            <Text style={styles.heading}>3. Content Moderation and Reporting</Text>
            <Text style={styles.body}>
                Trendly includes moderation tools to ensure a safe and professional environment for all users. Trendly reserves the right to:
                {'\n'}- Flag misleading or inappropriate brand content.
                {'\n'}- Temporarily or permanently restrict accounts posting abusive or unprofessional content.
                {'\n'}All flagged brand content will be reviewed within 24 hours and acted upon according to our guidelines.
            </Text>

            <Text style={styles.heading}>4. Advertising and Promotions</Text>
            <Text style={styles.body}>
                By registering with Trendly, your brand grants us the right to showcase and promote your public listings and brand name (excluding sensitive or private data) on our website, promotional materials, and social media campaigns. You may request exclusion by contacting our support team.
            </Text>

            <Text style={styles.heading}>5. License</Text>
            <Text style={styles.body}>
                We grant your brand a limited, non-exclusive, non-transferable, revocable license to use the Trendly app for business use related to influencer collaborations, subject to these Terms.
            </Text>

            <Text style={styles.heading}>6. Termination</Text>
            <Text style={styles.body}>
                We reserve the right to suspend or terminate your account and access to Trendly if you breach these Terms or engage in abusive or harmful behavior.
                This includes violations by brand representatives or misuse of collaboration tools and communication features.
            </Text>

            <Text style={styles.heading}>7. Changes to Terms</Text>
            <Text style={styles.body}>
                We reserve the right to update these Terms at any time. Continued use of the app after changes indicates acceptance.
            </Text>

            <Text style={styles.heading}>8. Contact Us</Text>
            <Text style={styles.lastBody}>
                If you have any questions or concerns about these Terms or wish to report content, please contact us at support@trendly.now.
            </Text>
        </ScrollView>
    )
}

export default TermsAndCondition

const useStyles = (colors: ReturnType<typeof Colors>) => React.useMemo(() => StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        marginBottom: 20,
        overflow: "hidden",
    },
    content: {
        padding: 20,
    },
    title: {
        color: colors.text,
        fontSize: fs(20),
        lineHeight: lh(28),
        fontWeight: 'bold',
        marginBottom: 12,
    },
    heading: {
        color: colors.text,
        fontSize: fs(15),
        lineHeight: lh(22),
        fontWeight: 'bold',
        marginBottom: 6,
    },
    // Legal copy is read end-to-end, so it uses the full-contrast text token
    // rather than textSecondary — that is gray300 in dark theme and only clears
    // 3.74:1 on the eerie-black modal surface (below WCAG AA 4.5:1).
    body: {
        color: colors.text,
        fontSize: fs(14),
        lineHeight: lh(21),
        marginBottom: 10,
    },
    lastBody: {
        color: colors.text,
        fontSize: fs(14),
        lineHeight: lh(21),
        marginBottom: 20,
    },
}), [colors])
