import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const FEATURE_ITEMS = [
    { icon: "🤝", title: "Direct Brand-Influencer Match", sub: "Connect with verified influencers without middlemen" },
    { icon: "💰", title: "Zero Commission", sub: "Keep 100% of your budget for campaigns" },
    { icon: "⚡", title: "Fast Campaign Setup", sub: "Post collaborations and start getting applications instantly" },
    { icon: "📊", title: "Guaranteed ROI", sub: "Smart matching ensures higher engagement and conversions" },
    // { icon: "🌍", title: "Wide Influencer Network", sub: "Access influencers across multiple niches and locations" },
    // { icon: "🔒", title: "Secure Payments", sub: "Escrow system ensures safe transactions for both parties" },
];

const LandingFooter = () => {
    const { width } = useWindowDimensions();
    const isWide = width >= 1000;

    {/* Feature summary strip */ }
    return (
        <View style={styles.featuresBar} >
            <View style={[styles.featuresInner, !isWide && { flexDirection: "column", gap: 32 }]}>
                {FEATURE_ITEMS.map((f, idx) => (
                    <View key={idx} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <View style={styles.featureTextWrap}>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureSub}>{f.sub}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View >
    )
}

export default LandingFooter

const styles = StyleSheet.create({

    /* Feature summary strip */
    featuresBar: {
        marginTop: 40,
        backgroundColor: "#1f3f73", // deep blue like screenshot
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    featuresInner: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "stretch",
        // justifyContent: "space-between",
        gap: 12,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
        paddingVertical: 6,
        // Use a width that allows 3–6 items per row depending on screen size
        // width: 180,
        minWidth: 150,
        flexShrink: 0,
    },
    featureIcon: {
        fontSize: 42,
        marginRight: 16,
        color: "#FFFFFF",
    },
    featureTextWrap: {
        flexShrink: 1,
        gap: 8,
    },
    featureTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
    featureSub: {
        color: "#D6E2F5",
        fontSize: 12,
        marginTop: 2,
    },

});