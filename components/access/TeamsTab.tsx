import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { FEATURES, featureLabel, TeamPrivileges } from "@/constants/Access";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet } from "react-native";
import { Modal, Portal, Switch } from "react-native-paper";
import { createTeam, deleteTeam, listTeams, Team, updateTeam } from "./api";

// A blank Team sentinel used when creating a new team.
const NEW_TEAM: Team = { id: "", name: "", isDefault: false, privileges: {} };

const TeamsTab: React.FC = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl, width), [colors, xl, width]);
    const { selectedBrand } = useBrandContext();

    const [teams, setTeams] = useState<Team[]>([]);
    const [editing, setEditing] = useState<Team | null>(null);
    const [name, setName] = useState("");
    const [draftPriv, setDraftPriv] = useState<TeamPrivileges>({});
    const [saving, setSaving] = useState(false);

    const fetchTeams = async () => {
        if (!selectedBrand) return;
        listTeams(selectedBrand.id).then(setTeams).catch(() => setTeams([]));
    };

    useEffect(() => {
        fetchTeams();
    }, [selectedBrand]);

    const openEditor = (team: Team) => {
        setEditing(team);
        setName(team.name);
        setDraftPriv(team.privileges ?? {});
    };

    const togglePriv = (feature: string, priv: string, on: boolean) => {
        setDraftPriv((prev) => {
            const current = new Set(prev[feature] ?? []);
            if (on) current.add(priv);
            else current.delete(priv);
            const next = { ...prev };
            if (current.size) next[feature] = Array.from(current);
            else delete next[feature];
            return next;
        });
    };

    const onSave = async () => {
        if (!selectedBrand || !editing) return;
        if (name.trim().length < 2) {
            Toaster.error("Enter a team name");
            return;
        }
        setSaving(true);
        try {
            if (editing.id === "") {
                await createTeam(selectedBrand.id, name.trim(), draftPriv);
                Toaster.success("Team created");
            } else {
                await updateTeam(selectedBrand.id, editing.id, { name: name.trim(), privileges: draftPriv });
                Toaster.success("Team updated");
            }
            setEditing(null);
            fetchTeams();
        } catch (e) {
            Toaster.error("Couldn't save team");
            Console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (team: Team) => {
        if (!selectedBrand) return;
        try {
            await deleteTeam(selectedBrand.id, team.id);
            Toaster.success("Team deleted");
            fetchTeams();
        } catch (e) {
            Toaster.error("Couldn't delete team");
            Console.error(e);
        }
    };

    const renderRow = ({ item }: { item: Team }) => {
        const features = Object.keys(item.privileges ?? {});
        const summary = item.isDefault
            ? "Full access"
            : features.length
                ? features.map(featureLabel).join(", ")
                : "No access yet";
        return (
            <Pressable style={styles.row} onPress={() => openEditor(item)}>
                <View style={styles.rowBody}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.summary} numberOfLines={1}>
                        {item.isDefault ? "Default team · " : ""}{summary}
                    </Text>
                </View>
                <View style={styles.actions}>
                    <Text style={styles.actionText}>Edit access</Text>
                    {!item.isDefault ? (
                        <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                            <Text style={styles.deleteText}>Delete</Text>
                        </Pressable>
                    ) : null}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <Button mode="contained" onPress={() => openEditor(NEW_TEAM)}>
                Add team
            </Button>

            <FlatList
                data={teams}
                renderItem={renderRow}
                keyExtractor={(item) => item.id || "new"}
                contentContainerStyle={styles.listContent}
            />

            <Portal>
                <Modal visible={!!editing} onDismiss={() => setEditing(null)} style={styles.modalRoot}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editing?.id === "" ? "New team" : "Edit team"}
                        </Text>
                        <TextInput label="Team name" mode="outlined" value={name} onChangeText={setName} />

                        {editing?.isDefault ? (
                            <Text style={styles.defaultNote}>
                                The default team always has full access and cannot be restricted.
                            </Text>
                        ) : (
                            <ScrollView style={styles.matrixScroll} contentContainerStyle={styles.matrixContent}>
                                {FEATURES.map((feature) => (
                                    <View key={feature.key} style={styles.featureBlock}>
                                        <Text style={styles.featureLabel}>{feature.label}</Text>
                                        {feature.privileges.map((p) => {
                                            const on = (draftPriv[feature.key] ?? []).includes(p.value);
                                            return (
                                                <View key={p.value} style={styles.privRow}>
                                                    <View style={styles.privText}>
                                                        <Text style={styles.privTitle}>{p.label}</Text>
                                                        <Text style={styles.privDesc}>{p.description}</Text>
                                                    </View>
                                                    <Switch
                                                        value={on}
                                                        onValueChange={(v) => togglePriv(feature.key, p.value, v)}
                                                        color={colors.primary}
                                                    />
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <Button mode="contained" onPress={onSave} style={styles.saveButton}>
                            {saving ? <ActivityIndicator color={colors.onPrimary} /> : "Save"}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>, xl: boolean, width: number) {
    const contentMaxWidth = Math.min(width - 48, 880);
    return StyleSheet.create({
        container: {
            flex: 1,
            padding: xl ? 24 : 12,
            gap: 12,
            backgroundColor: colors.background,
            ...(xl && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" }),
        },
        listContent: {
            gap: 10,
            paddingBottom: 24,
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        rowBody: {
            flex: 1,
            gap: 2,
        },
        name: {
            fontSize: 15,
            fontWeight: "600",
        },
        summary: {
            fontSize: 12,
            opacity: 0.6,
        },
        actions: {
            flexDirection: "row",
            gap: 16,
            alignItems: "center",
        },
        actionText: {
            fontSize: 13,
            color: colors.primary,
            fontWeight: "600",
        },
        deleteText: {
            fontSize: 13,
            color: colors.red,
            fontWeight: "600",
        },
        modalRoot: {
            justifyContent: "center",
            alignItems: "center",
        },
        modalContent: {
            padding: 16,
            gap: 12,
            borderRadius: 12,
            backgroundColor: colors.background,
            width: 420,
            maxWidth: "94%",
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: "700",
        },
        defaultNote: {
            fontSize: 13,
            opacity: 0.7,
            marginVertical: 8,
        },
        matrixScroll: {
            maxHeight: 420,
        },
        matrixContent: {
            gap: 14,
            paddingBottom: 4,
        },
        featureBlock: {
            gap: 6,
        },
        featureLabel: {
            fontSize: 14,
            fontWeight: "700",
        },
        privRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
        },
        privText: {
            flex: 1,
        },
        privTitle: {
            fontSize: 14,
            fontWeight: "600",
        },
        privDesc: {
            fontSize: 12,
            opacity: 0.6,
        },
        saveButton: {
            marginTop: 4,
            alignItems: "center",
        },
    });
}

export default TeamsTab;
