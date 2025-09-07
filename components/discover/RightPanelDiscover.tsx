import { Text, View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet } from 'react-native'
import { Button, Chip, HelperText, Menu, TextInput } from 'react-native-paper'
import TrendlyAdvancedFilter from './trendly/TrendlyAdvancedFilter'

// --------------------
// Component
// --------------------
const RightPanelDiscover = () => {
    const theme = useTheme()
    const colors = Colors(theme)

    const styles = useMemo(() => styleFn(colors), [colors])

    return (
        <View style={styles.container}>
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Access Multiple Databases</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary ?? colors.text }}>
                    Get access to over millions of users switching between multiple databases of influencers, with different advanced filters
                </Text>
            </View>

            <ScrollView>
                <TrendlyAdvancedFilter />
                {/* <ModashFilter /> */}
            </ScrollView>

            {/* Actions */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <View style={styles.actions}>
                    <Button mode="text" style={styles.clearBtn}>Clear all</Button>
                    <Button mode="contained" style={styles.actionBtn} icon="filter-variant">Apply</Button>
                </View>

                <HelperText type="info" style={styles.helper}>
                    Tip: You can refine these later. Values are placeholders for now.
                </HelperText>
            </View>
        </View>
    )
}

// --------------------
// Reusable bits
// --------------------
export const Section = ({ title, children, styles }: any) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Chip compact mode="outlined" style={styles.sectionChip} textStyle={{ fontSize: 10 }}>Clear</Chip>
        </View>
        {children}
    </View>
)

export const Dropdown = ({ label, placeholder, options, styles, flex, value, onChange }: any) => {
    const theme = useTheme()
    const [visible, setVisible] = React.useState(false)
    const [selected, setSelected] = React.useState<string | undefined>(value)

    const openMenu = () => setVisible(true)
    const closeMenu = () => setVisible(false)

    const handleSelect = (opt: string) => {
        setSelected(opt === 'Any' ? undefined : opt)
        onChange?.(opt === 'Any' ? undefined : opt)
        closeMenu()
    }

    return (
        <View style={[styles.field, flex ? { flex } : null]}>
            <Text style={styles.label}>{label}</Text>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                style={{ backgroundColor: Colors(theme).background }}
                anchor={
                    <Pressable onPress={openMenu}>
                        <TextInput
                            mode="outlined"
                            dense
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                            value={selected}
                            placeholder={placeholder}
                            style={styles.input}
                        />
                    </Pressable>
                }
            >
                {(options || []).map((opt: string) => (
                    <Menu.Item key={opt} onPress={() => handleSelect(opt)} title={opt} />
                ))}
            </Menu>
        </View>
    )
}

export const RangeInput = ({ label, min, max, setMin, setMax, styles }: any) => (
    <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inlineInputs}>
            <TextInput
                mode="outlined"
                dense
                keyboardType="numeric"
                value={min}
                onChangeText={setMin}
                placeholder="From"
                style={[styles.input, styles.inputInline]}
            />
            <Text style={styles.hyphen}>-</Text>
            <TextInput
                mode="outlined"
                dense
                keyboardType="numeric"
                value={max}
                onChangeText={setMax}
                placeholder="To"
                style={[styles.input, styles.inputInline]}
            />
        </View>
    </View>
)


// --------------------
// Styles
// --------------------
const styleFn = (colors: any) => StyleSheet.create({
    container: {
        maxWidth: 400,
        width: '100%',
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        backgroundColor: colors.card,
    },
    actions: {
        gap: 6,
        paddingTop: 6,
        flexDirection: "row",
        justifyContent: "flex-end"
    },
    actionBtn: {
        borderRadius: 10,
    },
    clearBtn: {
        alignSelf: 'center',
    },
    helper: {
        textAlign: 'right',
        fontSize: 11,
        opacity: 0.6,
        marginTop: 4,
    },
})

export default RightPanelDiscover