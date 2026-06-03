import { Text, View } from "@/components/theme/Themed";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import {
    faCheck,
    faChevronDown,
    faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
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
    onOpenChange?: (open: boolean) => void;
}

const labelFor = (team?: Team) =>
    team ? `${team.name}${team.isDefault ? " · default" : ""}` : "Select team";

const SocialTeamPicker: React.FC<SocialTeamPickerProps> = ({
    theme,
    brandId,
    socialId,
    currentTeamId,
    teams,
    onAssigned,
    onOpenChange,
}) => {
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);

    const setOpenState = (next: boolean) => {
        setOpen(next);
        onOpenChange?.(next);
    };

    const selectedTeam = useMemo(
        () =>
            teams.find((t) => t.id === currentTeamId) ??
            teams.find((t) => t.isDefault) ??
            teams[0],
        [teams, currentTeamId]
    );

    const assign = async (teamId: string) => {
        setOpenState(false);
        if (teamId === selectedTeam?.id) return;
        setSaving(true);
        try {
            await assignSocialTeam(brandId, socialId, teamId);
            Toaster.success("Team updated");
            onAssigned();
        } catch (e) {
            Toaster.error("Couldn't assign team");
            Console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (teams.length === 0) return null;

    return (
        <View style={[styles.root, open && styles.rootOpen]}>
            <View style={styles.labelRow}>
                <FontAwesomeIcon
                    icon={faUserGroup}
                    size={11}
                    color={colors.textSecondary}
                />
                <Text style={styles.label}>Team</Text>
            </View>

            <View style={styles.pickerWrap}>
                <Pressable
                    onPress={() => setOpenState(!open)}
                    disabled={saving}
                    style={({ hovered }) => [
                        styles.trigger,
                        hovered && styles.triggerHovered,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Change team"
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <>
                            <Text style={styles.triggerText} numberOfLines={1}>
                                {labelFor(selectedTeam)}
                            </Text>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                size={10}
                                color={colors.textSecondary}
                            />
                        </>
                    )}
                </Pressable>

                {open && (
                    <>
                        <Pressable
                            style={styles.backdrop}
                            onPress={() => setOpenState(false)}
                            accessibilityLabel="Close team menu"
                        />
                        <View style={styles.menu}>
                            {teams.map((t) => {
                                const selected = t.id === selectedTeam?.id;
                                return (
                                    <Pressable
                                        key={t.id}
                                        onPress={() => assign(t.id)}
                                        style={({ hovered }) => [
                                            styles.option,
                                            hovered && styles.optionHovered,
                                            selected && styles.optionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selected &&
                                                    styles.optionTextSelected,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {labelFor(t)}
                                        </Text>
                                        {selected && (
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                size={11}
                                                color={colors.primary}
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        root: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        // Lift the open picker above sibling cards so its menu paints on top.
        rootOpen: {
            zIndex: 50,
        },
        labelRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        label: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.textSecondary,
        },
        pickerWrap: {
            flex: 1,
            minWidth: 0,
        },
        trigger: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 10,
            minHeight: 34,
            backgroundColor: colors.tag,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            shadowOpacity: 0.04,
            elevation: 1,
        },
        triggerHovered: {
            opacity: 0.85,
        },
        triggerText: {
            flex: 1,
            fontSize: 13,
            fontWeight: "600",
            color: colors.text,
        },
        backdrop: {
            position: "absolute",
            top: -1000,
            left: -1000,
            right: -1000,
            bottom: -1000,
        },
        menu: {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: colors.card,
            zIndex: 100,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            shadowOpacity: 0.14,
            elevation: 12,
        },
        option: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingVertical: 9,
            paddingHorizontal: 12,
            minHeight: 38,
        },
        optionHovered: {
            backgroundColor: colors.tag,
        },
        optionSelected: {
            backgroundColor: colors.tag,
        },
        optionText: {
            flex: 1,
            fontSize: 13,
            color: colors.text,
        },
        optionTextSelected: {
            fontWeight: "700",
            color: colors.primary,
        },
    });
}

export default SocialTeamPicker;
