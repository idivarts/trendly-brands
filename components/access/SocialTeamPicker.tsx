import { Text, View } from "@/components/theme/Themed";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { type Theme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { assignSocialTeam, Team } from "./api";

interface SocialTeamPickerProps {
    theme: Theme;
    brandId: string;
    socialId: string;
    currentTeamId?: string;
    teams: Team[];
    onAssigned: () => void;
}

const SocialTeamPicker: React.FC<SocialTeamPickerProps> = ({
    theme,
    brandId,
    socialId,
    currentTeamId,
    teams,
    onAssigned,
}) => {
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [savingId, setSavingId] = useState<string | null>(null);

    const assign = async (teamId: string) => {
        if (teamId === currentTeamId) return;
        setSavingId(teamId);
        try {
            await assignSocialTeam(brandId, socialId, teamId);
            Toaster.success("Team updated");
            onAssigned();
        } catch (e) {
            Toaster.error("Couldn't assign team");
            Console.error(e);
        } finally {
            setSavingId(null);
        }
    };

    if (teams.length === 0) return null;

    return (
        <View style={styles.root}>
            <Text style={styles.label}>Team</Text>
            <View style={styles.chipWrap}>
                {teams.map((t) => {
                    const selected = t.id === currentTeamId;
                    return (
                        <Pressable
                            key={t.id}
                            onPress={() => assign(t.id)}
                            style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
                        >
                            {savingId === t.id ? (
                                <ActivityIndicator size="small" color={selected ? colors.onPrimary : colors.primary} />
                            ) : (
                                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                    {t.name}
                                    {t.isDefault ? " · default" : ""}
                                </Text>
                            )}
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
            gap: 6,
            marginTop: 10,
        },
        label: {
            fontSize: 12,
            fontWeight: "700",
            opacity: 0.7,
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
            minHeight: 30,
            justifyContent: "center",
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
    });
}

export default SocialTeamPicker;
