import {
    Country,
    COUNTRIES,
    isoToFlag,
} from "@/utils/countries";
import Colors from "@/shared-uis/constants/Colors";
import { faCheck, faChevronDown, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface PhoneNumberInputProps {
    /** Currently selected country (owns the dial code). */
    country: Country;
    onChangeCountry: (c: Country) => void;
    /** National number digits the user types (no dial code). */
    nationalNumber: string;
    onChangeNationalNumber: (s: string) => void;
    /** Fired when the user presses Enter on web — used to advance the step. */
    onSubmit?: () => void;
    autoFocus?: boolean;
}

/**
 * A split phone input: a tappable country chip (flag + dial code) on the left
 * and a clean national-number field on the right, unified inside one
 * `colors.tag` surface so it reads as a single control. The country is
 * auto-detected by the caller; tapping the chip opens a searchable picker.
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
    country,
    onChangeCountry,
    nationalNumber,
    onChangeNationalNumber,
    onSubmit,
    autoFocus,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        const digits = q.replace(/[^\d]/g, "");
        return COUNTRIES.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.iso2.toLowerCase().includes(q) ||
                (digits.length > 0 && c.dialCode.startsWith(digits)),
        );
    }, [query]);

    const handleSelect = (c: Country) => {
        onChangeCountry(c);
        setPickerOpen(false);
        setQuery("");
    };

    return (
        <>
            <View style={styles.field}>
                <Pressable
                    onPress={() => setPickerOpen(true)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Country code, ${country.name}, plus ${country.dialCode}`}
                >
                    <Text style={styles.flag}>{isoToFlag(country.iso2)}</Text>
                    <Text style={styles.dialCode}>+{country.dialCode}</Text>
                    <FontAwesomeIcon
                        icon={faChevronDown}
                        size={11}
                        color={colors.textSecondary}
                    />
                </Pressable>

                <View style={styles.divider} />

                <TextInput
                    style={styles.numberInput}
                    value={nationalNumber}
                    onChangeText={(t) => onChangeNationalNumber(t.replace(/[^\d\s-]/g, ""))}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    autoFocus={autoFocus}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    onKeyPress={(e: any) => {
                        if (
                            Platform.OS === "web" &&
                            e?.nativeEvent?.key === "Enter" &&
                            !e?.nativeEvent?.shiftKey
                        ) {
                            e.preventDefault?.();
                            onSubmit?.();
                        }
                    }}
                />
            </View>

            <Modal
                visible={pickerOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setPickerOpen(false)}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setPickerOpen(false)}
                />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Select country</Text>
                        <Pressable
                            onPress={() => setPickerOpen(false)}
                            hitSlop={10}
                            style={styles.closeBtn}
                        >
                            <FontAwesomeIcon icon={faXmark} size={16} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.searchBar}>
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            size={14}
                            color={colors.textSecondary}
                        />
                        <TextInput
                            style={styles.searchInput}
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search country or code"
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                            autoCorrect={false}
                        />
                    </View>

                    <FlatList
                        data={filtered}
                        keyExtractor={(c) => c.iso2}
                        keyboardShouldPersistTaps="handled"
                        style={styles.list}
                        renderItem={({ item }) => {
                            const selected = item.iso2 === country.iso2;
                            return (
                                <Pressable
                                    onPress={() => handleSelect(item)}
                                    style={({ pressed }) => [
                                        styles.row,
                                        selected && styles.rowSelected,
                                        pressed && styles.rowPressed,
                                    ]}
                                >
                                    <Text style={styles.rowFlag}>{isoToFlag(item.iso2)}</Text>
                                    <Text style={styles.rowName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.rowDial}>+{item.dialCode}</Text>
                                    {selected && (
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            size={14}
                                            color={colors.primary}
                                        />
                                    )}
                                </Pressable>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={styles.empty}>No countries match "{query}"</Text>
                        }
                    />
                </View>
            </Modal>
        </>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        field: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.tag,
            borderRadius: 14,
            paddingHorizontal: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        chip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 12,
            paddingVertical: 14,
        },
        chipPressed: { opacity: 0.6 },
        flag: { fontSize: 20 },
        dialCode: {
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
        },
        divider: {
            width: 1.5,
            height: 24,
            borderRadius: 1,
            backgroundColor: colors.textSecondary,
            opacity: 0.25,
            marginHorizontal: 4,
        },
        numberInput: {
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 14,
            fontSize: 17,
            color: colors.text,
        },

        // ── Picker sheet ─────────────────────────────────────────────────────
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.45)",
        },
        sheet: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: "82%",
            backgroundColor: colors.card,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -6 },
            shadowRadius: 20,
            shadowOpacity: 0.18,
            elevation: 12,
            ...(Platform.OS === "web" ? { maxWidth: 560, marginHorizontal: "auto" } : {}),
        },
        sheetHandle: {
            alignSelf: "center",
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.tag,
            marginTop: 10,
            marginBottom: 6,
        },
        sheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 10,
        },
        sheetTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
        },
        closeBtn: {
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.tag,
        },
        searchBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: colors.tag,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: Platform.OS === "ios" ? 12 : 6,
            marginHorizontal: 20,
            marginBottom: 8,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
            ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
        },
        list: {
            paddingHorizontal: 12,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 12,
            paddingVertical: 13,
            borderRadius: 12,
        },
        rowSelected: {
            backgroundColor: colors.tag,
        },
        rowPressed: { opacity: 0.6 },
        rowFlag: { fontSize: 22 },
        rowName: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
        },
        rowDial: {
            fontSize: 15,
            fontWeight: "600",
            color: colors.textSecondary,
        },
        empty: {
            textAlign: "center",
            color: colors.textSecondary,
            fontSize: 15,
            paddingVertical: 32,
        },
    });
}

export default PhoneNumberInput;
