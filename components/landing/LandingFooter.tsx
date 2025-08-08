import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const FEATURE_ITEMS = [
    { icon: "📘", title: "Marketing Partner", sub: "Facebook Premier Level Agency Partner" },
    { icon: "🟦", title: "Google Endorsed", sub: "Marketing Partner" },
    { icon: "📰", title: "Forbes Agency", sub: "Council Member" },
    { icon: "🏆", title: "Inc. 5000", sub: "Fastest Growing Company" },
    // { icon: "$", title: "$100M", sub: "In Annual Digital Ad Spend" },
    // { icon: "⏱️", title: "15+", sub: "Years of Facebook Advertising Experience" },
];

const LandingFooter = () => {
    {/* Feature summary strip */ }
    return (
        <View style={styles.featuresBar} >
            <View style={styles.featuresInner}>
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
        alignItems: "center",
        justifyContent: "space-between",
        rowGap: 12,
        gap: 12,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
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