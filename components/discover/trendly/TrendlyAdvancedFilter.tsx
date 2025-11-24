import { PageSortCommunication, useDiscovery } from "@/components/discover/Discover";
import Select from "@/components/ui/select";
import { INFLUENCER_CATEGORIES, INITIAL_INFLUENCER_CATEGORIES } from '@/constants/ItemsList';
import { useBrandContext } from '@/contexts/brand-context.provider';
import { useBreakpoints } from "@/hooks";
import { GENDER_SELECT } from "@/shared-constants/preferences/gender";
import { CITIES, POPULAR_CITIES } from '@/shared-constants/preferences/locations';
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import { MultiSelectExtendable } from '@/shared-uis/components/multiselect-extendable';
import { View } from '@/shared-uis/components/theme/Themed';
import Colors from '@/shared-uis/constants/Colors';
import { includeSelectedItems } from '@/shared-uis/utils/items-list';
import { faRightLong } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Theme, useTheme } from '@react-navigation/native';
import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { HelperText, Switch, Text, TextInput } from 'react-native-paper';
import { InfluencerItem } from '../DiscoverInfluencer';



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

interface IProps {
    FilterApplyRef: MutableRefObject<any>
}
const TrendlyAdvancedFilter = (props: IProps) => {
    const theme = useTheme()
    const styles = stylesFn(theme)

    const { selectedBrand } = useBrandContext()

    /** Local state (can be lifted later) */
    const [followerMin, setFollowerMin] = useState('')
    const [followerMax, setFollowerMax] = useState('')

    const [contentMin, setContentMin] = useState('')
    const [contentMax, setContentMax] = useState('')

    const [monthlyViewMin, setMonthlyViewMin] = useState('')
    const [monthlyViewMax, setMonthlyViewMax] = useState('')

    const [monthlyEngagementMin, setMonthlyEngagementMin] = useState('')
    const [monthlyEngagementMax, setMonthlyEngagementtMax] = useState('')

    const [avgViewsMin, setAvgViewsMin] = useState('')
    const [avgViewsMax, setAvgViewsMax] = useState('')

    const [avgLikesMin, setAvgLikesMin] = useState('')
    const [avgLikesMax, setAvgLikesMax] = useState('')

    const [avgCommentsMin, setAvgCommentsMin] = useState('')
    const [avgCommentsMax, setAvgCommentsMax] = useState('')

    const [qualityMin, setQualityMin] = useState('')
    const [qualityMax, setQualityMax] = useState('')

    const [erMin, setERMin] = useState('')
    const [erMax, setERMax] = useState('')

    const [descKeywords, setDescKeywords] = useState('')
    const [name, setName] = useState('')

    const [isVerified, setIsVerified] = useState(false)
    const [hasContact, setHasContact] = useState(false)

    const [genders, setGenders] = useState<string[]>([])

    const [selectedNiches, setSelectedNiches] = useState<string[]>([])
    const [selectedLocations, setSelectedLocations] = useState<string[]>([])

    // Sorting & pagination state
    const [sort, setSort] = useState<'followers' | 'views' | 'engagement' | 'engagement_rate'>('followers')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [offset, setOffset] = useState(0)
    const [limit, setLimit] = useState(16)

    const [data, setData] = useState<InfluencerItem[]>([])

    const { discoverCommunication, pageSortCommunication } = useDiscovery()

    pageSortCommunication.current = ({ page, sort }: PageSortCommunication) => {
        if (page)
            setOffset((page - 1) * 15)
        setSort(sort as any)
        setTimeout(() => {
            callApiRef.current(true)
        }, 20)
    }


    const { xl } = useBreakpoints()
    const getFormData = () => {
        // helpers
        const parseNumber = (v: string): number | undefined => {
            if (v == null) return undefined;
            const cleaned = v.replace(/,/g, "").trim();
            if (cleaned === "") return undefined;
            const n = Number(cleaned);
            return Number.isNaN(n) ? undefined : n;
        };

        const toPercentNumber = (v: string): number | undefined => {
            // Treat input as percentage number (e.g., "1.5" means 1.5%)
            const n = parseNumber(v);
            return n === undefined ? undefined : n;
        };

        const splitKeywords = (s: string): string[] | undefined => {
            if (!s || !s.trim()) return undefined;
            const arr = s
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            return arr.length ? arr : undefined;
        };

        // build payload
        const payload = {
            // Followers range (int64)
            followerMin: parseNumber(followerMin),
            followerMax: parseNumber(followerMax),

            // Content/posts count range (int)
            contentMin: parseNumber(contentMin),
            contentMax: parseNumber(contentMax),

            // Estimated monthly views range (int64)
            monthlyViewMin: parseNumber(monthlyViewMin),
            monthlyViewMax: parseNumber(monthlyViewMax),

            // Estimated monthly engagements range (int64)
            monthlyEngagementMin: parseNumber(monthlyEngagementMin),
            monthlyEngagementMax: parseNumber(monthlyEngagementMax),

            // Median/average metrics ranges (int64)
            avgViewsMin: parseNumber(avgViewsMin),
            avgViewsMax: parseNumber(avgViewsMax),
            avgLikesMin: parseNumber(avgLikesMin),
            avgLikesMax: parseNumber(avgLikesMax),
            avgCommentsMin: parseNumber(avgCommentsMin),
            avgCommentsMax: parseNumber(avgCommentsMax),

            // Quality/aesthetics slider (0..100) (int)
            qualityMin: parseNumber(qualityMin),
            qualityMax: parseNumber(qualityMax),

            // Engagement rate as percent number (float64)
            erMin: toPercentNumber(erMin), // e.g., "1.5" -> 1.5
            erMax: toPercentNumber(erMax),

            // Text filters
            descKeywords: splitKeywords(descKeywords),
            name: name?.trim() || undefined,

            // Flags
            isVerified: isVerified || undefined,
            hasContact: hasContact || undefined,

            // Multi-selects
            genders: genders.length ? genders : undefined,
            selectedNiches: selectedNiches.length ? selectedNiches : undefined,
            selectedLocations: selectedLocations.length ? selectedLocations : undefined,

        } as const;

        console.log("Payload Object", payload, followerMin, followerMax);

        // prune empty objects/undefined recursively
        const prune = (obj: any): any => {
            if (obj == null || typeof obj !== "object") return obj;
            if (Array.isArray(obj)) return obj;
            const out: Record<string, any> = {};
            for (const [k, v] of Object.entries(obj)) {
                const pv = prune(v);
                const isEmptyObject =
                    pv && typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length === 0;
                if (pv !== undefined && !isEmptyObject) out[k] = pv;
            }
            return out;
        };

        return {
            ...prune(payload),

            // Sorting & pagination
            sort: sort || undefined,
            sort_direction: sortDirection || 'desc',
            offset: offset,
            limit: limit,
        };
    }

    const callApi = async (reset: boolean = false) => {
        discoverCommunication.current?.({
            loading: true,
            data: []
        })
        try {
            let body = await HttpWrapper.fetch(`/discovery/brands/${selectedBrand?.id || ""}/influencers`, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(getFormData())
            }).then(async res => {
                return res.json()
            })
            const d = body.data as InfluencerItem[]
            const newData = [...(reset ? [] : data), ...d]
            setData(newData)
            discoverCommunication.current?.({
                loading: false,
                data: newData,
                page: (offset / 15) + 1,
                sort: sort
            })
        } catch (e) {
            discoverCommunication.current?.({
                loading: false,
                data: []
            })
        } finally {

        }
    }

    const resetAndCallApi = () => {
        // Reset all filters and variables to initial defaults
        setFollowerMin("")
        setFollowerMax("")

        setContentMin("")
        setContentMax("")

        setMonthlyViewMin("")
        setMonthlyViewMax("")

        setMonthlyEngagementMin("")
        setMonthlyEngagementtMax("")

        setAvgViewsMin("")
        setAvgViewsMax("")

        setAvgLikesMin("")
        setAvgLikesMax("")

        setAvgCommentsMin("")
        setAvgCommentsMax("")

        setQualityMin("")
        setQualityMax("")

        setERMin("")
        setERMax("")

        setDescKeywords("")
        setName("")

        setIsVerified(false)
        setHasContact(false)

        setGenders([])
        setSelectedNiches([])
        setSelectedLocations([])

        // Sorting & pagination defaults
        setSort('followers')
        setSortDirection('desc')
        setOffset(0)
        setLimit(15)

        // Clear current data
        setData([])

        // Defer the API call so new state is applied before building payload
        setTimeout(() => {
            callApiRef.current(true)
        }, 10)
    }

    // add near other hooks
    const callApiRef = useRef(callApi)
    const resetCallApiRef = useRef(resetAndCallApi)

    // keep the ref pointing to the latest callApi whenever inputs change
    useEffect(() => {
        callApiRef.current = callApi
        resetCallApiRef.current = resetAndCallApi
    })

    useEffect(() => {
        callApi()
        return () => {
            if (xl) {
                discoverCommunication.current?.({
                    loading: false,
                    data: []
                })
            }
        }
    }, [])

    props.FilterApplyRef.current = (action: string) => {
        setOffset(0)
        if (action == "apply") {
            callApiRef.current(true)
        } else {
            resetCallApiRef.current()
        }
    }


    // Unlocked: full filter UI
    return (

        <View style={[styles.surface]}>
            <View style={styles.fieldsWrap}>

                <Text style={{ fontWeight: 600 }}>Demography and Niche</Text>
                {/* creator_gender */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Creator gender</Text>
                    <Select
                        items={GENDER_SELECT}
                        multiselect
                        onSelect={(item) => {
                            setGenders(item.map((value) => value.value));
                        }}
                        selectItemIcon
                        value={genders.map((value) => ({ label: value, value }))}
                    />
                </View>

                {/* influencer niche (multi-select tags) */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Influencer niche</Text>
                    <MultiSelectExtendable
                        buttonIcon={
                            <FontAwesomeIcon
                                icon={faRightLong}
                                color={Colors(theme).primary}
                                size={14}
                            />
                        }
                        buttonLabel="Others"
                        initialItemsList={includeSelectedItems(
                            INFLUENCER_CATEGORIES,
                            selectedNiches
                        )}
                        initialMultiselectItemsList={includeSelectedItems(
                            INITIAL_INFLUENCER_CATEGORIES,
                            selectedNiches
                        )}
                        onSelectedItemsChange={(values) => {
                            setSelectedNiches(values.map(v => v));
                        }}
                        selectedItems={selectedNiches}
                        theme={theme}
                    />
                    {/* <Select
                        items={INFLUENCER_CATEGORIES.map(v => ({ label: v, value: v }))}
                        multiselect
                        onSelect={(item) => {
                            setSelectedNiches(item.map((value) => value.value));
                        }}
                        selectItemIcon
                        value={selectedNiches.map((value) => ({ label: value, value }))}
                    /> */}
                </View>

                {/* creator_location (multi-select tags) */}
                <View style={{ backgroundColor: Colors(theme).transparent }}>
                    <Text style={styles.fieldLabel} variant="labelSmall">Creator location</Text>
                    <MultiSelectExtendable
                        buttonIcon={
                            <FontAwesomeIcon
                                icon={faRightLong}
                                color={Colors(theme).primary}
                                size={14}
                            />
                        }
                        buttonLabel="Others"
                        initialItemsList={includeSelectedItems(
                            CITIES,
                            selectedLocations
                        )}
                        initialMultiselectItemsList={includeSelectedItems(
                            POPULAR_CITIES,
                            selectedLocations
                        )}
                        onSelectedItemsChange={(values) => {
                            setSelectedLocations(values.map(v => v));
                        }}
                        selectedItems={selectedLocations}
                        theme={theme}
                    />
                </View>

                <Text style={{ fontWeight: 600, marginTop: 16 }}>Basic Metrics</Text>
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

                {/* monthly_reach */}
                <RangeInputs
                    label="Monthly Views"
                    min={monthlyViewMin}
                    max={monthlyViewMax}
                    onChangeMin={setMonthlyViewMin}
                    onChangeMax={setMonthlyViewMax}
                    theme={theme}
                />

                {/* monthly_views */}
                <RangeInputs
                    label="Monthly Engagements"
                    min={monthlyEngagementMin}
                    max={monthlyEngagementMax}
                    onChangeMin={setMonthlyEngagementMin}
                    onChangeMax={setMonthlyEngagementtMax}
                    theme={theme}
                />

                <Text style={{ fontWeight: 600, marginTop: 16 }}>Fine Tuned Metrics</Text>
                {/* average_views */}
                <RangeInputs
                    label="Average Views"
                    min={avgViewsMin}
                    max={avgViewsMax}
                    onChangeMin={setAvgViewsMin}
                    onChangeMax={setAvgViewsMax}
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
                    label="Engagement Rate (average 2% - 5%)"
                    min={erMin}
                    max={erMax}
                    onChangeMin={setERMin}
                    onChangeMax={setERMax}
                    placeholderMin='Min (0)'
                    placeholderMax='Max (100)'
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

                <Text style={{ fontWeight: 600, marginTop: 16 }}>Keyword Filters</Text>
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

                <Text style={{ fontWeight: 600, marginTop: 16 }}>Other Filters</Text>
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