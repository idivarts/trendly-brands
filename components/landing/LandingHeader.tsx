import { useMyGrowthBook } from '@/contexts/growthbook-context-provider'
import { analyticsLogEvent } from '@/shared-libs/utils/firebase/analytics'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import { usePathname } from 'expo-router'
import React, { PropsWithChildren, useMemo } from 'react'
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { CAL_LINK } from './const'

const LandingHeader: React.FC<PropsWithChildren> = ({ children }) => {
    const theme = useTheme()
    const colors = Colors(theme)
    const styles = useMemo(() => makeStyles(colors), [colors])
    const { features: { demoLink } } = useMyGrowthBook()
    const path = usePathname()
    return (
        <View style={styles.header}>
            <Pressable onPress={() => Linking.openURL("https://www.trendly.now")}>
                <Image
                    source={require("@/assets/images/rectangluar blue logo transparent.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Pressable>
            {children}
            <Pressable style={styles.demoBtn} onPress={() => {
                analyticsLogEvent("request_demo", {
                    pathName: path
                })
                open(demoLink ? demoLink : CAL_LINK)
            }}>
                <Text style={styles.demoIcon}>🎥</Text>
                <Text style={styles.demoText}>Request a Demo</Text>
            </Pressable>
        </View>
    )
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
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
            backgroundColor: colors.surface || colors.card,
            shadowColor: colors.text,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            ...Platform.select({ android: { elevation: 3 } }),
        },
        demoIcon: { fontSize: 16, marginRight: 8 },
        demoText: { color: colors.text, fontSize: 14, fontWeight: "600" },
    })
}

export default LandingHeader