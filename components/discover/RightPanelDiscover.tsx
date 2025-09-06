import { Text, View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { useTheme } from '@react-navigation/native'
import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button, Chip, Divider, HelperText, List, SegmentedButtons, Switch, TextInput } from 'react-native-paper'

// --------------------
// Constants (placeholder options; wire real data later)
// --------------------
const PLATFORM_OPTIONS = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'youtube', label: 'YouTube' },
]

const LOCATION_OPTIONS = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore']
const GENDER_OPTIONS = ['Any', 'Male', 'Female']
const AGE_OPTIONS = ['Any', '13-17', '18-24', '25-34', '35-44', '45+']
const LANGUAGE_OPTIONS = ['Any', 'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu']
const GROWTH_OPTIONS = ['Any', 'Growth', 'Decline', 'Flat']
const PERIOD_OPTIONS = ['30d', '60d', '90d']
const ENGAGEMENT_OPTIONS = ['Any', '≥1% (avg)', '≥2% (avg)', '≥5% (avg)']
const CATEGORY_OPTIONS = ['Any', 'Fashion', 'Beauty', 'Comedy', 'Tech', 'Food']
const ACCOUNT_TYPE_OPTIONS = ['Any', 'Creator', 'Business', 'Personal']
const SOCIALS_OPTIONS = ['Any', 'Email', 'WhatsApp', 'YouTube', 'Twitter/X']
const FAKE_FOLLOWER_OPTIONS = ['Any', '≤10%', '≤25%', '≤40%']

// --------------------
// Component
// --------------------
const RightPanelDiscover = () => {
    const theme = useTheme()
    const colors = Colors(theme)

    const styles = useMemo(() => styleFn(colors), [colors])

    // UI states (visual only for now)
    const [platform, setPlatform] = useState('instagram')
    const [query, setQuery] = useState('')
    const [emailAvailable, setEmailAvailable] = useState(false)
    const [hideSaved, setHideSaved] = useState(false)

    const [followersMin, setFollowersMin] = useState('5000')
    const [followersMax, setFollowersMax] = useState('50000')
    const [viewsMin, setViewsMin] = useState('10000')
    const [viewsMax, setViewsMax] = useState('')

    return (
        <View style={styles.container}>
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>External Database Filters</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary ?? colors.text }}>
                    Apply filters to find the right creators
                </Text>
            </View>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Platform Selector */}
                <SegmentedButtons
                    value={platform}
                    onValueChange={setPlatform}
                    buttons={PLATFORM_OPTIONS.map((p) => ({
                        value: p.value, label: p.label,
                        style: platform == p.value && { backgroundColor: Colors(theme).primary }
                    }))}
                    style={styles.segment}
                />

                {/* Search */}
                <TextInput
                    mode="outlined"
                    dense
                    value={query}
                    onChangeText={setQuery}
                    placeholder="creator handle or email"
                    left={<TextInput.Icon icon="magnify" />}
                    style={styles.input}
                />

                {/* Toggles */}
                <View style={styles.toggleRow}>
                    <Switch value={emailAvailable} onValueChange={setEmailAvailable} />
                    <Text style={styles.toggleLabel}>Email available</Text>
                </View>
                <View style={styles.toggleRow}>
                    <Switch value={hideSaved} onValueChange={setHideSaved} />
                    <Text style={styles.toggleLabel}>Hide saved profiles</Text>
                </View>

                <Divider style={styles.divider} />

                {/* Demographics */}
                <Section title="Demographics" styles={styles}>
                    <Dropdown label="Location" placeholder="Any" options={LOCATION_OPTIONS} styles={styles} />
                    <Dropdown label="Gender" placeholder="Any" options={GENDER_OPTIONS} styles={styles} />
                    <Dropdown label="Age" placeholder="Any" options={AGE_OPTIONS} styles={styles} />
                    <Dropdown label="Language" placeholder="Any" options={LANGUAGE_OPTIONS} styles={styles} />
                </Section>

                {/* Performance */}
                <Section title="Performance" styles={styles}>
                    <RangeInput label="Followers" min={followersMin} max={followersMax} setMin={setFollowersMin} setMax={setFollowersMax} styles={styles} />
                    <View style={[styles.inlineInputs, { gap: 18 }]}>
                        <Dropdown label="Followers growth" placeholder="Growth" options={GROWTH_OPTIONS} styles={styles} flex={1} />
                        <Dropdown label="Period" placeholder="Period" options={PERIOD_OPTIONS} styles={styles} flex={1} />
                    </View>
                    <Dropdown label="Engagement rate" placeholder="≥2% (average)" options={ENGAGEMENT_OPTIONS} styles={styles} />
                    <RangeInput label="Views" min={viewsMin} max={viewsMax} setMin={setViewsMin} setMax={setViewsMax} styles={styles} />
                </Section>

                {/* Content */}
                <Section title="Content" styles={styles}>
                    <Dropdown label="Categories" placeholder="Any" options={CATEGORY_OPTIONS} styles={styles} />
                    <Dropdown label="Topics" placeholder="Any" options={CATEGORY_OPTIONS} styles={styles} />
                    <Dropdown label="Hashtags" placeholder="Any" options={CATEGORY_OPTIONS} styles={styles} />
                    <Dropdown label="Mentions" placeholder="Any" options={CATEGORY_OPTIONS} styles={styles} />
                    <Dropdown label="Captions" placeholder="Any" options={CATEGORY_OPTIONS} styles={styles} />
                    <List.Item
                        title="Has sponsored posts"
                        left={(props) => <List.Icon {...props} icon="bullhorn" />}
                        right={() => <Switch value={false} onValueChange={() => { }} />}
                        style={styles.listItem}
                    />
                </Section>

                {/* Account */}
                <Section title="Account" styles={styles}>
                    <TextInput mode="outlined" dense placeholder="Bio" style={styles.input} />
                    <Dropdown label="Type" placeholder="Any" options={ACCOUNT_TYPE_OPTIONS} styles={styles} />
                    <Dropdown label="Socials" placeholder="Any" options={SOCIALS_OPTIONS} styles={styles} />
                    <Dropdown label="Fake followers" placeholder="≤25%" options={FAKE_FOLLOWER_OPTIONS} styles={styles} />
                </Section>

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
const Section = ({ title, children, styles }: any) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Chip compact mode="outlined" style={styles.sectionChip} textStyle={{ fontSize: 10 }}>Clear</Chip>
        </View>
        {children}
    </View>
)

const Dropdown = ({ label, placeholder, options, styles, flex }: any) => (
    <View style={[styles.field, flex ? { flex } : null]}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            mode="outlined"
            dense
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            placeholder={placeholder}
            style={styles.input}
        />
    </View>
)

const RangeInput = ({ label, min, max, setMin, setMax, styles }: any) => (
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
    scroll: {
        padding: 12,
        gap: 8,
    },
    segment: {
        marginBottom: 6,
    },
    input: {
        borderRadius: 10,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    toggleLabel: {
        fontSize: 12,
        color: colors.textSecondary ?? colors.text,
    },
    divider: {
        marginVertical: 8,
        opacity: 0.8,
    },
    section: {
        paddingVertical: 6,
        gap: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    sectionChip: {
        borderColor: colors.border,
        height: 24,
    },
    field: {
        gap: 4,
    },
    label: {
        fontSize: 11,
        opacity: 0.7,
    },
    inlineInputs: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputInline: {
        flex: 1,
    },
    hyphen: {
        paddingHorizontal: 6,
        opacity: 0.6,
    },
    listItem: {
        borderRadius: 8,
        paddingLeft: 8,
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