import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";

import Toaster from "@/shared-uis/components/toaster/Toaster";
import { LinearGradient } from 'expo-linear-gradient';

// ---- Discount countdown config ----
const OFFER_HOURS = 0.1 * 1.0 / 60; // 3 days window
const nowTs = () => new Date().getTime();

function getCountdownParts(ms: number) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { days, hours, minutes, seconds };
}

const OfferCard = () => {
    // heartbeat pulse for countdown timer
    const timerPulse = useRef(new Animated.Value(1)).current;
    const offerScale = useRef(new Animated.Value(0.9)).current;

    const { width } = useWindowDimensions();
    const isWide = width >= 1000;


    // End time persists for the session; fallback to 72h from first render
    const endRef = useRef<number>(nowTs() + OFFER_HOURS * 60 * 60 * 1000);
    const [remaining, setRemaining] = useState(endRef.current - nowTs());
    const isExpired = remaining <= 0;

    useEffect(() => {
        if (isExpired) {
            Toaster.error("You just missed your Offer! :(")
        }
    }, [isExpired])

    useEffect(() => {// looped heartbeat on countdown timer
        const t = setInterval(() => {
            setRemaining(endRef.current - nowTs());
        }, 1000);

        // bounce-in offer card (if visible)
        Animated.spring(offerScale, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
        }).start();

        return () => clearInterval(t);
    }, []);

    // urgency thresholds for color + pulse
    const isWarn = remaining <= 10 * 60 * 1000;   // <= 10 minutes
    const isDanger = remaining <= 5 * 60 * 1000;  // <= 5 minutes

    const timerTheme = useMemo(() => {
        if (isExpired) {
            return {
                bg: 'rgba(255,255,255,0.08)',
                border: 'rgba(255,255,255,0.18)',
                num: '#E5ECF5',
                lbl: '#C7D2FE',
                sep: '#C7D2FE',
                pulseTo: 1,
                pulseDur: 600,
            };
        }
        if (isDanger) {
            return {
                bg: 'rgba(244,67,54,0.25)',
                border: 'rgba(244,67,54,0.8)',
                num: '#FFFFFF',
                lbl: '#FFECEC',
                sep: '#FFECEC',
                pulseTo: 1.12,
                pulseDur: 450,
            };
        }
        if (isWarn) {
            return {
                bg: 'rgba(255,193,7,0.22)',
                border: 'rgba(255,193,7,0.75)',
                num: '#FFF8E1',
                lbl: '#FFE082',
                sep: '#FFE082',
                pulseTo: 1.08,
                pulseDur: 500,
            };
        }
        return {
            bg: 'rgba(255,255,255,0.15)',
            border: 'rgba(255,255,255,0.35)',
            num: '#FFFFFF',
            lbl: '#E5ECF5',
            sep: '#E5ECF5',
            pulseTo: 1.06,
            pulseDur: 550,
        };
    }, [isWarn, isDanger, isExpired]);

    // dynamic heartbeat intensity based on urgency
    useEffect(() => {
        // stop any running animation and restart with new intensity
        timerPulse.stopAnimation();
        timerPulse.setValue(1);
        if (isExpired) {
            // no pulse animation after expiry
            return;
        }
        const up = Animated.timing(timerPulse, {
            toValue: timerTheme.pulseTo,
            duration: timerTheme.pulseDur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        });
        const down = Animated.timing(timerPulse, {
            toValue: 1,
            duration: timerTheme.pulseDur,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        });
        const loop = Animated.loop(Animated.sequence([up, down]));
        loop.start();
        return () => loop.stop();
    }, [timerTheme.pulseTo, timerTheme.pulseDur, isExpired]);

    const parts = useMemo(() => getCountdownParts(Math.max(0, remaining)), [remaining]);

    return (
        <Animated.View
            style={[
                { transform: [{ scale: offerScale }] },
            ]}
        >
            <LinearGradient
                colors={isExpired ? ["#434343", "#2C3E50", "#1F2937"] : ["#8E2DE2", "#E94057", "#F27121"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.offerWrap,
                !isWide && { paddingBottom: 16 },
                styles.offerCard]}
            >
                <View>
                    {!isExpired ? (
                        <>
                            <Text style={styles.offerHeading}>Special Offer for you - Ends in</Text>
                            <Text style={styles.offerTitle}>Flat <Text style={{ fontWeight: '900' }}>50% OFF</Text></Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.offerHeading}>Offer ended</Text>
                            <Text style={styles.offerTitle}>You just missed it</Text>
                            <Text style={styles.offerEndedNote}>Better luck next time.</Text>
                        </>
                    )}
                </View>

                {!isExpired ? (
                    <Animated.View style={[styles.timerRow, { transform: [{ scale: timerPulse }] }]}>
                        <View style={[styles.timerBox, { backgroundColor: timerTheme.bg, borderColor: timerTheme.border }]}>
                            <Text style={[styles.timerNum, { color: timerTheme.num }]}>{String(parts.minutes).padStart(2, '0')}</Text>
                            <Text style={[styles.timerLbl, { color: timerTheme.lbl }]}>minutes</Text>
                        </View>
                        <Text style={[styles.timerSep, { color: timerTheme.sep }]}>:</Text>
                        <View style={[styles.timerBox, { backgroundColor: timerTheme.bg, borderColor: timerTheme.border }]}>
                            <Text style={[styles.timerNum, { color: timerTheme.num }]}>{String(parts.seconds).padStart(2, '0')}</Text>
                            <Text style={[styles.timerLbl, { color: timerTheme.lbl }]}>seconds</Text>
                        </View>
                    </Animated.View>
                ) : (
                    <View style={styles.expiredPill}>
                        <Text style={styles.expiredPillText}>Expired</Text>
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    )
}

export default OfferCard

const styles = StyleSheet.create({
    // ---- Discount offer styles ----
    offerWrap: {
        marginTop: 0,
        marginBottom: 16,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 18,
        alignItems: 'center',
        shadowColor: '#2667B8',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap-reverse',
        ...Platform.select({ android: { elevation: 4 } }),
    },
    offerCard: {
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap-reverse',
        width: '100%',
    },
    offerClose: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerCloseText: { color: '#8a8a8a', fontSize: 16 },
    offerHeading: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
    offerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
    timerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    timerBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        minWidth: 64,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    timerNum: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
    timerLbl: { fontSize: 12, color: '#E5ECF5', marginTop: 2 },
    timerSep: { fontSize: 24, color: '#E5ECF5', marginHorizontal: 8, marginBottom: 10 },
    offerCta: {
        marginTop: 16,
        backgroundColor: '#EA4E5A',
        borderRadius: 999,
        paddingHorizontal: 28,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({ android: { elevation: 2 } }),
    },
    offerCtaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    offerFoot: { marginTop: 10, color: '#6C7A89', fontSize: 12 },
    expiredPill: {
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        alignSelf: 'flex-start'
    },
    expiredPillText: { color: '#E5ECF5', fontWeight: '800', letterSpacing: 0.5 },
    offerEndedNote: { marginTop: 6, color: '#E5ECF5', fontSize: 12 }
})