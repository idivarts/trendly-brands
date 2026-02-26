import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useMyGrowthBook } from "@/contexts/growthbook-context-provider";
import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import Colors from "@/shared-uis/constants/Colors";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { LinearGradient } from 'expo-linear-gradient';

// ---- Discount countdown config ----
const OFFER_HOURS = 30 * 1.0 / 60; // 3 days window
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
    const { loading, features: { discountTimer }, discountEndTime } = useMyGrowthBook()
    if (!loading || (discountEndTime == 0 && discountTimer > 0))
        return null
    return <WaitToRender />
}

const WaitToRender = () => {
    const theme = useTheme();
    const colors = Colors(theme);
    const { features: { discountTimer, limitedTimeDiscount }, discountEndTime } = useMyGrowthBook()

    // heartbeat pulse for countdown timer
    const timerPulse = useRef(new Animated.Value(1)).current;
    const offerScale = useRef(new Animated.Value(0.9)).current;

    const { xl, width } = useBreakpoints();
    const isWide = xl || width >= 1000;


    // End time persists for the session; fallback to 72h from first render
    const [remaining, setRemaining] = useState(discountEndTime - nowTs());
    console.log("Offer Reminaind", discountEndTime, nowTs(), remaining);

    const isExpired = remaining <= 0 && discountTimer > 0;

    useEffect(() => {
        if (isExpired) {
            Toaster.error("You just missed your Offer! :(")
        }
    }, [isExpired])

    useEffect(() => {// looped heartbeat on countdown timer
        // bounce-in offer card (if visible)
        Animated.spring(offerScale, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (discountTimer > 0) {
            const t = setInterval(() => {
                setRemaining(discountEndTime - nowTs());
            }, 1000);
            return () => clearInterval(t);
        }
    }, [discountTimer])

    // urgency thresholds for color + pulse
    const isWarn = remaining <= 10 * 60 * 1000;   // <= 10 minutes
    const isDanger = remaining <= 5 * 60 * 1000;  // <= 5 minutes

    const timerTheme = useMemo(() => {
        if (isExpired) {
            return {
                bg: colors.offerTimerExpiredBg,
                border: colors.offerTimerExpiredBorder,
                num: colors.offerTimerExpiredNum,
                lbl: colors.offerTimerExpiredNum,
                sep: colors.offerTimerExpiredNum,
                pulseTo: 1,
                pulseDur: 600,
            };
        }
        if (isDanger) {
            return {
                bg: colors.offerTimerDangerBg,
                border: colors.offerTimerDangerBorder,
                num: colors.white,
                lbl: colors.offerTimerDangerLbl,
                sep: colors.offerTimerDangerLbl,
                pulseTo: 1.12,
                pulseDur: 450,
            };
        }
        if (isWarn) {
            return {
                bg: colors.offerTimerWarnBg,
                border: colors.offerTimerWarnBorder,
                num: colors.offerTimerWarnNum,
                lbl: colors.offerTimerWarnLbl,
                sep: colors.offerTimerWarnLbl,
                pulseTo: 1.08,
                pulseDur: 500,
            };
        }
        return {
            bg: colors.offerTimerDefaultBg,
            border: colors.offerTimerDefaultBorder,
            num: colors.offerTimerNum,
            lbl: colors.offerTimerLbl,
            sep: colors.offerTimerLbl,
            pulseTo: 1.06,
            pulseDur: 550,
        };
    }, [isWarn, isDanger, isExpired, colors]);

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

    const styles = useMemo(
        () =>
            StyleSheet.create({
                offerWrap: {
                    marginTop: 0,
                    marginBottom: 16,
                    borderRadius: 16,
                    paddingVertical: 4,
                    paddingHorizontal: 18,
                    alignItems: 'center',
                    shadowColor: colors.offerShadow,
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
                offerCloseText: { color: colors.formLabel, fontSize: 16 },
                offerHeading: { fontSize: 16, fontWeight: '700', color: colors.white, marginTop: 2 },
                offerTitle: { fontSize: 28, fontWeight: '800', color: colors.white, marginTop: 2 },
                timerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
                timerBox: {
                    backgroundColor: colors.offerTimerDefaultBg,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    minWidth: 64,
                    borderWidth: 1,
                    borderColor: colors.offerTimerDefaultBorder,
                },
                timerNum: { fontSize: 28, fontWeight: '900', color: colors.white },
                timerLbl: { fontSize: 12, color: colors.offerTimerLbl, marginTop: 2 },
                timerSep: { fontSize: 24, color: colors.offerTimerLbl, marginHorizontal: 8, marginBottom: 10 },
                offerCta: {
                    marginTop: 16,
                    backgroundColor: colors.offerCtaBg,
                    borderRadius: 999,
                    paddingHorizontal: 28,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...Platform.select({ android: { elevation: 2 } }),
                },
                offerCtaText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
                offerFoot: { marginTop: 10, color: colors.formLabel, fontSize: 12 },
                expiredPill: {
                    marginVertical: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: colors.offerExpiredPillBg,
                    borderWidth: 1,
                    borderColor: colors.offerExpiredPillBorder,
                    alignSelf: 'center'
                },
                expiredPillText: { color: colors.offerExpiredPillText, fontWeight: '800', letterSpacing: 0.5 },
                offerEndedNote: { marginTop: 6, color: colors.offerExpiredPillText, fontSize: 12 }
            }),
        [colors]
    );

    const gradientColors = isExpired
        ? [colors.offerGradientExpired1, colors.offerGradientExpired2, colors.offerGradientExpired3]
        : [colors.offerGradientActive1, colors.offerGradientActive2, colors.offerGradientActive3];

    if (limitedTimeDiscount == 0)
        return null

    return (
        <Animated.View
            style={[
                { transform: [{ scale: offerScale }] },
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.offerWrap,
                !isWide && { paddingBottom: 16 },
                styles.offerCard]}
            >
                <View>
                    {!isExpired ? (
                        <>
                            <Text style={styles.offerHeading}>Special Offer for you {discountTimer > 0 && '- Ends soon...'}</Text>
                            <Text style={styles.offerTitle}>Flat <Text style={{ fontWeight: '900' }}>{limitedTimeDiscount}% OFF</Text></Text>
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
                    discountTimer > 0 &&
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