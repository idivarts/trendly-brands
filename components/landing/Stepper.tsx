import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { BLUE, BLUE_DARK, BLUE_LIGHT, TEXT } from './const'

const Stepper = ({ count = 2 }) => {
    {/* Stepper */ }
    return (
        <View style={styles.stepperWrap}>
            <Text style={styles.stepperLabel}>Step {count} of 3</Text>
            <View style={styles.stepperRow}>
                {/* Step 1 */}
                <View style={styles.stepGroup}>
                    <View style={[styles.stepDot, styles.stepDone]}>
                        <Text style={styles.stepNum}>1</Text>
                    </View>
                    <View style={[styles.stepBar, styles.stepBarDone]} />
                </View>
                {/* Step 2 (current) */}
                <View style={styles.stepGroup}>
                    <View style={[styles.stepDot, count == 2 ? styles.stepCurrent : styles.stepDone]}>
                        <Text style={styles.stepNum}>2</Text>
                    </View>
                    <View style={[styles.stepBar, count == 2 ? styles.stepBarPending : styles.stepBarDone]} />
                </View>
                {/* Step 3 */}
                <View style={styles.stepGroup}>
                    <View style={[styles.stepDot, styles.stepPending]}>
                        <Text style={styles.stepNum}>3</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Stepper

const styles = StyleSheet.create({
    // Stepper
    stepperWrap: {
        marginBottom: 28,
    },
    stepperLabel: {
        color: TEXT,
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
        backgroundColor: '#E9F0F8',
        borderWidth: 1,
        borderColor: '#E1E6EE',
    },
    stepNum: {
        color: TEXT,
        fontSize: 13,
        fontWeight: '800',
    },
    stepBar: {
        height: 4,
        borderRadius: 4,
        marginHorizontal: 10,
        flex: 1,
        backgroundColor: '#E9F0F8',
    },
    stepDone: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    stepCurrent: {
        backgroundColor: BLUE_DARK,
        borderColor: BLUE_DARK,
    },
    stepPending: {
        backgroundColor: '#E9F0F8',
        borderColor: '#E1E6EE',
    },
    stepBarDone: {
        backgroundColor: BLUE_LIGHT,
    },
    stepBarPending: {
        backgroundColor: '#E9F0F8',
    },
})