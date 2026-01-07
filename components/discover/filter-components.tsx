import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import { Chip, Menu, TextInput } from "react-native-paper";
import { Text, View } from "@/shared-uis/components/theme/Themed";

interface SectionProps {
    title: string;
    children: React.ReactNode;
    styles: any;
}

interface DropdownProps {
    label: string;
    placeholder?: string;
    options: string[];
    styles: any;
    flex?: number;
    value?: string;
    onChange?: (value: string | undefined) => void;
}

interface RangeInputProps {
    label: string;
    min?: string;
    max?: string;
    setMin: (value: string) => void;
    setMax: (value: string) => void;
    styles: any;
}

export const Section: React.FC<SectionProps> = ({
    title,
    children,
    styles,
}) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Chip
                compact
                mode="outlined"
                style={styles.sectionChip}
                textStyle={{ fontSize: 10 }}
            >
                Clear
            </Chip>
        </View>
        {children}
    </View>
);

export const Dropdown: React.FC<DropdownProps> = ({
    label,
    placeholder,
    options,
    styles,
    flex,
    value,
    onChange,
}) => {
    const theme = useTheme();
    const [visible, setVisible] = React.useState(false);
    const [selected, setSelected] = React.useState<string | undefined>(value);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const handleSelect = (opt: string) => {
        const nextValue = opt === "Any" ? undefined : opt;
        setSelected(nextValue);
        onChange?.(nextValue);
        closeMenu();
    };

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
    );
};

export const RangeInput: React.FC<RangeInputProps> = ({
    label,
    min,
    max,
    setMin,
    setMax,
    styles,
}) => (
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
);
