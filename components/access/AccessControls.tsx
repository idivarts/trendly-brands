import { Text } from "@/components/theme/Themed";
import { featureLabel } from "@/constants/Access";
import Colors from "@/shared-uis/constants/Colors";
import { type Theme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Team } from "./api";

interface AccessControlsProps {
    theme: Theme;
    teams: Team[];
    selectedTeamId: string;
    onTeamChange: (id: string) => void;
}

// A member belongs to exactly one team and inherits its feature privileges, so
// member-level access editing is now just picking that team. Privileges are
// edited on the team itself (see TeamsTab).
const AccessControls: React.FC<AccessControlsProps> = ({
    theme,
    teams,
    selectedTeamId,
    onTeamChange,
}) => {
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.root}>
            <Text style={styles.sectionLabel}>Team</Text>
            <Text style={styles.sectionHint}>
                The member inherits the access of the team they belong to.
            </Text>
            <View style={styles.teamList}>
                {teams.map((t) => {
                    const selected = t.id === selectedTeamId;
                    const features = Object.keys(t.privileges ?? {});
                    const summary = t.isDefault
                        ? "Full access"
                        : features.length
                            ? features.map(featureLabel).join(", ")
                            : "No access";
                    return (
                        <Pressable
                            key={t.id}
                            onPress={() => onTeamChange(t.id)}
                            style={[styles.teamRow, selected ? styles.teamRowSelected : styles.teamRowIdle]}
                        >
                            <View style={styles.teamRowHeader}>
                                <Text style={[styles.teamTitle, selected && styles.teamTitleSelected]}>
                                    {t.name}{t.isDefault ? " · default" : ""}
                                </Text>
                                <View style={[styles.radio, selected && styles.radioSelected]} />
                            </View>
                            <Text style={[styles.teamDesc, selected && styles.teamTitleSelected]} numberOfLines={1}>
                                {summary}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
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
        teamList: {
            gap: 8,
        },
        teamRow: {
            padding: 12,
            borderRadius: 10,
            gap: 2,
        },
        teamRowIdle: {
            backgroundColor: colors.tag,
        },
        teamRowSelected: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            shadowOpacity: 0.35,
            elevation: 4,
        },
        teamRowHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        teamTitle: {
            fontSize: 15,
            fontWeight: "700",
        },
        teamDesc: {
            fontSize: 12,
            opacity: 0.75,
        },
        teamTitleSelected: {
            color: colors.onPrimary,
        },
        radio: {
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.background,
            opacity: 0.5,
        },
        radioSelected: {
            backgroundColor: colors.onPrimary,
            opacity: 1,
        },
    });
}

export default AccessControls;
