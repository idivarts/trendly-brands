import { useMyGrowthBook } from '@/contexts/growthbook-context-provider';
import Colors from '@/shared-uis/constants/Colors';
import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Stepper = ({ count = 0, total = 3 }) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { features: { hideAboutBrand, hideContentGoals, payWall } } = useMyGrowthBook()

    // Full landing flow (absolute positions, all steps present):
    //   1 get-started (hero, no stepper) · 2 create-brand · 3 content-goals
    //   4 about-brand · 5 pricing
    // Any of content-goals / about-brand can be hidden via flags, and pricing
    // is excluded from the count when there's no paywall. Compute the displayed
    // numbers by subtracting the hidden steps that fall before the current one.
    const subs = (!payWall ? 1 : 0) + (hideAboutBrand ? 1 : 0) + (hideContentGoals ? 1 : 0)
    const hiddenBefore = (hideContentGoals && count > 3 ? 1 : 0) + (hideAboutBrand && count > 4 ? 1 : 0)
    const finalCount = count - hiddenBefore
    const finalTotal = total - subs

    const steps = Array.from({ length: finalTotal }, (_, i) => i + 1);

    return (
        <View style={styles.stepperWrap}>
            <Text style={styles.stepperLabel}>Step {finalCount} of {finalTotal}</Text>
            <View style={styles.stepperRow}>
                {steps.map((step, index) => (
                    <View key={step} style={styles.stepGroup}>
                        <View style={[
                            styles.stepDot,
                            step < finalCount ? styles.stepDone : step === finalCount ? styles.stepCurrent : styles.stepPending
                        ]}>
                            <Text style={styles.stepNum}>{step}</Text>
                        </View>
                        {index !== steps.length - 1 && (
                            <View style={[
                                styles.stepBar,
                                step < finalCount ? styles.stepBarDone : styles.stepBarPending
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    )
}

function makeStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        stepperWrap: {
            marginBottom: 28,
        },
        stepperLabel: {
            color: colors.text,
            fontSize: 12,
            fontWeight: '700',
            opacity: 0.8,
            marginBottom: 8,
        },
        stepperRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        stepGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        stepDot: {
            width: 16,
            height: 16,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.tag,
            borderWidth: 1,
            borderColor: colors.border,
        },
        stepNum: {
            color: colors.text,
            fontSize: 13,
            fontWeight: '800',
        },
        stepBar: {
            height: 4,
            borderRadius: 4,
            marginHorizontal: 10,
            flex: 1,
            backgroundColor: colors.tag,
        },
        stepDone: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        stepCurrent: {
            backgroundColor: colors.primaryDark || colors.primary,
            borderColor: colors.primaryDark || colors.primary,
        },
        stepPending: {
            backgroundColor: colors.tag,
            borderColor: colors.border,
        },
        stepBarDone: {
            backgroundColor: colors.secondary,
        },
        stepBarPending: {
            backgroundColor: colors.tag,
        },
    });
}

export default Stepper