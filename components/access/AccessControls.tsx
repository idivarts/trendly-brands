import { Text, View } from "@/components/theme/Themed";
import { ASSIGNABLE_ROLES, OVERRIDE_TOGGLES } from "@/constants/Access";
import Colors from "@/shared-uis/constants/Colors";
import { type Theme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Switch } from "react-native-paper";
import { Team } from "./api";

interface AccessControlsProps {
    theme: Theme;
    role: string;
    onRoleChange: (role: string) => void;
    teams: Team[];
    selectedTeamIds: string[];
    onTeamsChange: (ids: string[]) => void;
    overrides: Record<string, boolean>;
    onOverridesChange: (overrides: Record<string, boolean>) => void;
}

const AccessControls: React.FC<AccessControlsProps> = ({
    theme,
    role,
    onRoleChange,
    teams,
    selectedTeamIds,
    onTeamsChange,
    overrides,
    onOverridesChange,
}) => {
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const toggleTeam = (teamId: string) => {
        if (selectedTeamIds.includes(teamId)) {
            onTeamsChange(selectedTeamIds.filter((id) => id !== teamId));
        } else {
            onTeamsChange([...selectedTeamIds, teamId]);
        }
    };

    const toggleOverride = (cap: string, value: boolean) => {
        const next = { ...overrides };
        if (value) {
            next[cap] = true;
        } else {
            delete next[cap];
        }
        onOverridesChange(next);
    };

    return (
        <View style={styles.root}>
            {/* Role */}
            <Text style={styles.sectionLabel}>Role</Text>
            <View style={styles.roleList}>
                {ASSIGNABLE_ROLES.map((r) => {
                    const selected = r.value === role;
                    return (
                        <Pressable
                            key={r.value}
                            onPress={() => onRoleChange(r.value)}
                            style={[styles.roleRow, selected ? styles.roleRowSelected : styles.roleRowIdle]}
                        >
                            <View style={styles.roleRowHeader}>
                                <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{r.label}</Text>
                                <Text style={[styles.rolePillar, selected && styles.roleTitleSelected]}>{r.pillar}</Text>
                            </View>
                            <Text style={[styles.roleDesc, selected && styles.roleTitleSelected]}>{r.description}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Teams */}
            {teams.length > 0 && (
                <>
                    <Text style={styles.sectionLabel}>Teams</Text>
                    <Text style={styles.sectionHint}>Scope this member to specific teams.</Text>
                    <View style={styles.chipWrap}>
                        {teams.map((t) => {
                            const selected = selectedTeamIds.includes(t.id);
                            return (
                                <Pressable
                                    key={t.id}
                                    onPress={() => toggleTeam(t.id)}
                                    style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
                                >
                                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                        {t.name}
                                        {t.isDefault ? " · default" : ""}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            )}

            {/* Advanced override toggles */}
            <Pressable onPress={() => setShowAdvanced((s) => !s)} style={styles.advancedHeader}>
                <Text style={styles.sectionLabel}>Advanced permissions</Text>
                <Text style={styles.advancedChevron}>{showAdvanced ? "▴" : "▾"}</Text>
            </Pressable>
            {showAdvanced && (
                <View style={styles.toggleList}>
                    <Text style={styles.sectionHint}>Grant sensitive permissions beyond the base role.</Text>
                    {OVERRIDE_TOGGLES.map((toggle) => (
                        <View key={toggle.value} style={styles.toggleRow}>
                            <View style={styles.toggleTextWrap}>
                                <Text style={styles.toggleTitle}>{toggle.label}</Text>
                                <Text style={styles.toggleDesc}>{toggle.description}</Text>
                            </View>
                            <Switch
                                value={overrides[toggle.value] === true}
                                onValueChange={(v) => toggleOverride(toggle.value, v)}
                                color={colors.primary}
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            gap: 8,
            width: "100%",
        },
        sectionLabel: {
            fontSize: 14,
            fontWeight: "700",
            marginTop: 8,
        },
        sectionHint: {
            fontSize: 12,
            opacity: 0.6,
            marginBottom: 4,
        },
        roleList: {
            gap: 8,
        },
        roleRow: {
            padding: 12,
            borderRadius: 10,
            gap: 2,
        },
        roleRowIdle: {
            backgroundColor: colors.tag,
        },
        roleRowSelected: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        roleRowHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        roleTitle: {
            fontSize: 15,
            fontWeight: "700",
        },
        rolePillar: {
            fontSize: 11,
            opacity: 0.7,
        },
        roleDesc: {
            fontSize: 12,
            opacity: 0.75,
        },
        roleTitleSelected: {
            color: colors.onPrimary,
        },
        chipWrap: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        chip: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
        },
        chipIdle: {
            backgroundColor: colors.tag,
        },
        chipSelected: {
            backgroundColor: colors.primary,
        },
        chipText: {
            fontSize: 13,
        },
        chipTextSelected: {
            color: colors.onPrimary,
        },
        advancedHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
        },
        advancedChevron: {
            fontSize: 14,
        },
        toggleList: {
            gap: 10,
            marginTop: 4,
        },
        toggleRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        toggleTextWrap: {
            flex: 1,
        },
        toggleTitle: {
            fontSize: 14,
            fontWeight: "600",
        },
        toggleDesc: {
            fontSize: 12,
            opacity: 0.6,
        },
    });
}

export default AccessControls;
