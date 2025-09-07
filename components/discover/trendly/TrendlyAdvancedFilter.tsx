import { useBrandContext } from '@/contexts/brand-context.provider'
import { View } from '@/shared-uis/components/theme/Themed'
import Colors from '@/shared-uis/constants/Colors'
import { Theme, useTheme } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Chip, HelperText, Menu, Button as PaperButton, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper'
import { DiscoverCommuninicationChannel } from '../DiscoverInfluencer'
import { MOCK_INFLUENCERS } from '../mock/influencers'


/** DROPDOWN / TAG DATA (can be wired from props later) */
const ENGAGEMENT_RATE_OPTIONS = [
    'No restriction', '>0.5%', '>1%', '>1.5%', '>2%', '>3%', '>5%'
]

const CREATOR_GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'neutral', label: 'Neutral' },
]

// Keep these lightweight; replace with server-driven lists later
const NICHES = [
    'Fashion/Beauty', 'Comedy', 'Tech & Gadgets', 'Food', 'Fitness', 'Travel', 'Education', 'Lifestyle', 'Parenting', 'Gaming'
]

const LOCATIONS = [
    'India', 'USA', 'UK', 'UAE', 'Singapore', 'Canada', 'Australia', 'Germany', 'France', 'Remote'
]

/** Small inline component for min/max numeric ranges */
const RangeInputs = ({
    label,
    min,
    max,
    onChangeMin,
    onChangeMax,
    placeholderMin = 'Min',
    placeholderMax = 'Max',
    theme,
}: {
    label: string
    min: string
    max: string
    onChangeMin: (v: string) => void
    onChangeMax: (v: string) => void
    placeholderMin?: string
    placeholderMax?: string
    theme: Theme
}) => {
    const styles = stylesFn(theme)
    return (
        <View style={{ backgroundColor: 'transparent' }}>
            <Text style={styles.fieldLabel} variant="labelSmall">{label}</Text>
            <View style={styles.rangeRow}>
                <TextInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={min}
                    onChangeText={onChangeMin}
                    placeholder={placeholderMin}
                    style={[styles.input, styles.rangeInput]}
                />
                <Text style={styles.toDash}>to</Text>
                <TextInput
                    mode="outlined"
                    keyboardType="numeric"
                    value={max}
                    onChangeText={onChangeMax}
                    placeholder={placeholderMax}
                    style={[styles.input, styles.rangeInput]}
                />
            </View>
        </View>
    )
}

const TrendlyAdvancedFilter = () => {
    const theme = useTheme()
    const styles = stylesFn(theme)

    const { selectedBrand } = useBrandContext()

    /** Local state (can be lifted later) */
    const [followerMin, setFollowerMin] = useState('')
    const [followerMax, setFollowerMax] = useState('')

    const [contentMin, setContentMin] = useState('')
    const [contentMax, setContentMax] = useState('')

    const [avgLikesMin, setAvgLikesMin] = useState('')
    const [avgLikesMax, setAvgLikesMax] = useState('')

    const [avgCommentsMin, setAvgCommentsMin] = useState('')
    const [avgCommentsMax, setAvgCommentsMax] = useState('')

    const [qualityMin, setQualityMin] = useState('')
    const [qualityMax, setQualityMax] = useState('')

    const [descKeywords, setDescKeywords] = useState('')
    const [name, setName] = useState('')

    const [isVerified, setIsVerified] = useState(false)
    const [hasContact, setHasContact] = useState(false)

    const [gender, setGender] = useState('gender-neutral')

    const [erMenuVisible, setErMenuVisible] = useState(false)
    const [erSelected, setErSelected] = useState<string | null>(null)

    const [selectedNiches, setSelectedNiches] = useState<string[]>([])
    const [selectedLocations, setSelectedLocations] = useState<string[]>([])

    const toggleTag = (value: string, list: string[], setList: (v: string[]) => void) => {
        if (list.includes(value)) setList(list.filter(v => v !== value))
        else setList([...list, value])
    }

    useEffect(() => {
        DiscoverCommuninicationChannel.next({
            loading: false,
            data: MOCK_INFLUENCERS
        })
        return () => {
            DiscoverCommuninicationChannel.next({
                loading: false,
                data: []
            })
        }
    }, [])

    // Unlocked: full filter UI
    return (

        <View style={[styles.surface]}>
            <View style={styles.fieldsWrap}>
                {/* follower_count */}
                <RangeInputs
                    label="Follower count"
                    min={followerMin}
                    max={followerMax}
                    onChangeMin={setFollowerMin}
                    onChangeMax={setFollowerMax}
                    theme={theme}
                />

                {/* content_count */}
                <RangeInputs
                    label="Content count"
                    min={contentMin}
                    max={contentMax}
                    onChangeMin={setContentMin}
                    onChangeMax={setContentMax}
                    theme={theme}
                />

                {/* average_likes */}
                <RangeInputs
                    label="Average likes"
                    min={avgLikesMin}
                    max={avgLikesMax}
                    onChangeMin={setAvgLikesMin}
                    onChangeMax={setAvgLikesMax}
                    theme={theme}
                />

                {/* average_comments */}
                <RangeInputs
                    label="Average comments"
                    min={avgCommentsMin}
                    max={avgCommentsMax}
                    onChangeMin={setAvgCommentsMin}
                    onChangeMax={setAvgCommentsMax}
                    theme={theme}
                />

                {/* influencer aesthetics / quality*/}
                <RangeInputs
                    label="Influencer aesthetics / quality (0-100)"
                    min={qualityMin}
                    max={qualityMax}
                    onChangeMin={setQualityMin}
                    onChangeMax={setQualityMax}
                    placeholderMin='Min (0)'
                    placeholderMax='Max (100)'
                    theme={theme}
                />


                {/* description_keywords */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Bio keywords</Text>
                    <TextInput
                        mode="outlined"
                        value={descKeywords}
                        onChangeText={setDescKeywords}
                        placeholder="fashion, GRWM, skincare"
                        style={styles.input}
                    />
                    <HelperText type="info" visible>
                        Separate keywords with comma. We’ll match against the bio.
                    </HelperText>
                </View>

                {/* name */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Name</Text>
                    <TextInput
                        mode="outlined"
                        value={name}
                        onChangeText={setName}
                        placeholder="Search by creator name"
                        style={styles.input}
                    />
                </View>

                {/* is_verified & has_contact_details */}
                <View style={[styles.switchRow, { backgroundColor: Colors(theme).transparent }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, backgroundColor: Colors(theme).transparent }}>
                        <Switch value={isVerified} onValueChange={setIsVerified} />
                        <Text variant="bodyMedium">Verified account</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, backgroundColor: Colors(theme).transparent }}>
                        <Switch value={hasContact} onValueChange={setHasContact} />
                        <Text variant="bodyMedium">Has contact details</Text>
                    </View>
                </View>

                {/* engagement_rate */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Engagement rate</Text>
                    <Menu
                        style={{ backgroundColor: Colors(theme).background }}
                        visible={erMenuVisible}
                        onDismiss={() => setErMenuVisible(false)}
                        anchor={
                            <PaperButton
                                mode="outlined"
                                onPress={() => setErMenuVisible(true)}
                                style={styles.input}
                            >
                                {erSelected ?? 'Select a threshold'}
                            </PaperButton>
                        }
                    >
                        {ENGAGEMENT_RATE_OPTIONS.map(opt => (
                            <Menu.Item
                                key={opt}
                                onPress={() => { setErSelected(opt); setErMenuVisible(false) }}
                                title={opt}
                            />
                        ))}
                    </Menu>
                </View>

                {/* creator_gender */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Creator gender</Text>
                    <SegmentedButtons
                        style={styles.segmentGroup}
                        value={gender}
                        onValueChange={setGender}
                        buttons={CREATOR_GENDER_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    />
                </View>

                {/* influencer niche (multi-select tags) */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Influencer niche</Text>
                    <View style={styles.chipsWrap}>
                        {NICHES.map(tag => (
                            <Chip
                                key={tag}
                                selected={selectedNiches.includes(tag)}
                                onPress={() => toggleTag(tag, selectedNiches, setSelectedNiches)}
                                style={styles.chip}
                            >
                                {tag}
                            </Chip>
                        ))}
                    </View>
                </View>

                {/* creator_location (multi-select tags) */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Creator location</Text>
                    <View style={styles.chipsWrap}>
                        {LOCATIONS.map(loc => (
                            <Chip
                                key={loc}
                                selected={selectedLocations.includes(loc)}
                                onPress={() => toggleTag(loc, selectedLocations, setSelectedLocations)}
                                style={styles.chip}
                            >
                                {loc}
                            </Chip>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    )
}

const stylesFn = (theme: Theme) => StyleSheet.create({
    scroll: { flex: 1 },
    scrollContent: { paddingVertical: 8 },
    container: { padding: 12, gap: 10, flex: 1 },
    surface: {
        borderRadius: 14,
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
        backgroundColor: 'transparent'
    },
    headerIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors(theme).transparent
    },

    comingSoonCard: {
        borderRadius: 14,
        padding: 14,
        overflow: 'hidden',
    },
    soonBadge: {
        backgroundColor: Colors(theme).background,
        color: Colors(theme).textSecondary,
    },
    soonTitle: { color: Colors(theme).white, fontWeight: '700' },
    soonSubtitle: { color: Colors(theme).gray200 },
    soonList: { marginTop: 6, gap: 10, backgroundColor: 'transparent' },
    soonListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'transparent' },
    soonBulletIcon: {
        width: 26,
        height: 26,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors(theme).transparent,
    },
    soonListTitle: { color: Colors(theme).white, fontWeight: '600' },
    soonListDesc: { color: Colors(theme).gray200 },
    soonCtaBtn: { alignSelf: 'flex-start', marginTop: 24 },
    soonFootnote: { color: Colors(theme).gray200, marginTop: 10 },

    segmentGroup: { marginTop: 4 },
    segmentBtn: {},
    segmentBtnActive: { backgroundColor: Colors(theme).primary },

    fieldsWrap: { backgroundColor: 'transparent', gap: 12 },
    fieldLabel: { color: Colors(theme).textSecondary, marginBottom: 6 },
    input: { backgroundColor: Colors(theme).card, height: 36 },
    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
    rangeInput: { flex: 1 },
    toDash: { color: Colors(theme).textSecondary },
    switchRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'transparent' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
    chip: {},
})

export default TrendlyAdvancedFilter