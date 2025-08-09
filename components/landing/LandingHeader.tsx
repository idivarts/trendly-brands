import { useMyGrowthBook } from '@/contexts/growthbook-context-provider'
import { useMyNavigation } from '@/shared-libs/utils/router'
import React from 'react'
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { CAL_LINK, TEXT } from './const'

const LandingHeader = () => {
    const { features: { demoLink } } = useMyGrowthBook()
    const router = useMyNavigation()
    return (
        <View style={styles.header}>
            <Pressable onPress={() => Linking.openURL("https://www.trendly.now")}>
                <Image
                    source={require("@/assets/images/rectangluar blue logo transparent.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Pressable>
            <Pressable style={styles.demoBtn} onPress={() => open(demoLink ? demoLink : CAL_LINK)}>
                <Text style={styles.demoIcon}>🎥</Text>
                <Text style={styles.demoText}>Request a Demo</Text>
            </Pressable>
        </View>
    )
}

export default LandingHeader


const styles = StyleSheet.create({
    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    logo: {
        width: 100,
        height: 70,
    },
    demoBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        height: 42,
        borderRadius: 999,
        backgroundColor: "#EEF4FB",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        ...Platform.select({ android: { elevation: 3 } }),
    },
    demoIcon: { fontSize: 16, marginRight: 8 },
    demoText: { color: TEXT, fontSize: 14, fontWeight: "600" },

})