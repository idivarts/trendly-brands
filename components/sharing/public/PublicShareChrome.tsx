import { ShareTier } from "@/hooks/use-public-share";
import { IShareLink } from "@/shared-libs/firestore/trendly-pro/models/share-links";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import Colors from "@/shared-uis/constants/Colors";
import {
    faArrowUpRightFromSquare,
    faRightFromBracket,
    faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface PublicShareChromeProps {
    tier: ShareTier;
    viewerName: string | null;
    share: (IShareLink & { token: string }) | null;
}

/** Authenticated editor route for the shared resource (member "open" action). */
function workspaceHref(share: IShareLink): string {
    if (share.type === "strategy" && share.resourceId) {
        return `/content-strategies/${share.resourceId}`;
    }
    if (share.type === "content" && share.resourceId) {
        return `/contents/${share.resourceId}`;
    }
    if (share.type === "calendarMonth" && share.month) {
        return `/content-calendar?focusDate=${share.month}-01`;
    }
    return "/content-strategies";
}

const PublicShareChrome: React.FC<PublicShareChromeProps> = ({ tier, viewerName, share }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const router = useRouter();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleLogin = () => router.push("/login");
    const handleLogout = async () => {
        try {
            await signOut(AuthApp);
        } catch {
            /* no-op — page re-resolves to anonymous on next load */
        }
    };
    const handleOpen = () => {
        if (share) router.push(workspaceHref(share) as never);
    };

    return (
        <View style={styles.bar}>
            <View style={styles.brand}>
                <Image
                    source={require("@/assets/images/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.viewLabel}>Shared view</Text>
            </View>

            <View style={styles.actions}>
                {tier === "anon" && (
                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                        onPress={handleLogin}
                    >
                        <FontAwesomeIcon icon={faRightToBracket} size={13} color={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>Log in / Sign up</Text>
                    </Pressable>
                )}

                {tier === "guest" && (
                    <>
                        {!!viewerName && (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {viewerName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Pressable
                            style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
                            onPress={handleLogout}
                            accessibilityLabel="Log out"
                        >
                            <FontAwesomeIcon
                                icon={faRightFromBracket}
                                size={13}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.ghostBtnText}>Log out</Text>
                        </Pressable>
                    </>
                )}

                {tier === "member" && (
                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                        onPress={handleOpen}
                    >
                        <FontAwesomeIcon
                            icon={faArrowUpRightFromSquare}
                            size={13}
                            color={colors.onPrimary}
                        />
                        <Text style={styles.primaryBtnText}>Open in your workspace</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        bar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
            zIndex: 10,
        },
        brand: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        logo: {
            width: 110,
            height: 28,
        },
        viewLabel: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.textSecondary,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: colors.tag,
            overflow: "hidden",
        },
        actions: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },
        avatar: {
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },
        avatarText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        primaryBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 9,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        primaryBtnText: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.onPrimary,
        },
        ghostBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.tag,
        },
        ghostBtnText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        pressed: {
            opacity: 0.75,
        },
    });
}

export default PublicShareChrome;
