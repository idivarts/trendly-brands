import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import {
    ACCESS_PRESETS,
    allPrivilegesFor,
    defaultNewTeamPrivileges,
    FEATURES,
    featureLabel,
    FeatureKey,
    matchPresetKey,
    TeamPrivileges,
} from "@/constants/Access";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet } from "react-native";
import { IconButton, Modal, Portal, Switch } from "react-native-paper";
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
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    // Which preset (if any) the current draft matches exactly.
    const activePreset = useMemo(() => matchPresetKey(draftPriv), [draftPriv]);

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
        // New teams start from the Editor preset (everything except brand admin);
        // existing teams load their saved privileges.
        setDraftPriv(team.id === "" ? defaultNewTeamPrivileges() : (team.privileges ?? {}));
        setExpanded({});
    };

    const toggleExpand = (feature: string) => {
        setExpanded((prev) => ({ ...prev, [feature]: !prev[feature] }));
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

    // Master toggle for a feature: grant every privilege, or remove them all.
    const toggleFeature = (feature: FeatureKey, on: boolean) => {
        setDraftPriv((prev) => {
            const next = { ...prev };
            if (on) next[feature] = allPrivilegesFor(feature);
            else delete next[feature];
            return next;
        });
    };

    const applyPreset = (key: string) => {
        const preset = ACCESS_PRESETS.find((p) => p.key === key);
        if (preset) setDraftPriv(preset.build());
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
                        {/* Pinned header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderText}>
                                <Text style={styles.modalTitle}>
                                    {editing?.id === "" ? "New team" : "Edit team"}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {editing?.isDefault
                                        ? "The default team for everyone in your brand."
                                        : "Name the team, then choose what it can access."}
                                </Text>
                            </View>
                            <IconButton
                                icon="close"
                                size={20}
                                onPress={() => setEditing(null)}
                                iconColor={colors.text}
                                style={styles.closeButton}
                            />
                        </View>

                        {/* Pinned form region: name + presets */}
                        <View style={styles.formRegion}>
                            <TextInput label="Team name" mode="outlined" value={name} onChangeText={setName} />

                            {editing?.isDefault ? null : (
                                <View style={styles.presetSection}>
                                    <Text style={styles.presetLabel}>Start from a preset</Text>
                                    <View style={styles.presetRow}>
                                        {ACCESS_PRESETS.map((preset) => {
                                            const active = activePreset === preset.key;
                                            return (
                                                <Pressable
                                                    key={preset.key}
                                                    onPress={() => applyPreset(preset.key)}
                                                    style={[styles.presetChip, active && styles.presetChipActive]}
                                                >
                                                    <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                                                        {preset.label}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                        {!activePreset ? (
                                            <View style={[styles.presetChip, styles.presetChipActive]}>
                                                <Text style={[styles.presetChipText, styles.presetChipTextActive]}>
                                                    Custom
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Scrollable body */}
                        {editing?.isDefault ? (
                            <View style={styles.defaultNoteWrap}>
                                <Text style={styles.defaultNote}>
                                    The default team always has full access and cannot be restricted.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.matrixScroll} contentContainerStyle={styles.matrixContent}>
                                {FEATURES.map((feature) => {
                                    const granted = (draftPriv[feature.key] ?? []).length;
                                    const total = feature.privileges.length;
                                    const someOn = granted > 0;
                                    const isOpen = !!expanded[feature.key];
                                    return (
                                        <View key={feature.key} style={styles.featureCard}>
                                            <Pressable
                                                style={styles.featureRow}
                                                onPress={() => toggleExpand(feature.key)}
                                            >
                                                <IconButton
                                                    icon={isOpen ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    iconColor={colors.text}
                                                    onPress={() => toggleExpand(feature.key)}
                                                    style={styles.chevron}
                                                />
                                                <View style={styles.featureHeaderText}>
                                                    <Text style={styles.featureLabel}>{feature.label}</Text>
                                                    <Text style={styles.featureDesc}>
                                                        {someOn && granted < total
                                                            ? `${granted} of ${total} enabled`
                                                            : feature.description}
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={someOn}
                                                    onValueChange={(v) => toggleFeature(feature.key, v)}
                                                    color={colors.primary}
                                                />
                                            </Pressable>

                                            {isOpen ? (
                                                <View style={styles.privList}>
                                                    {feature.privileges.map((p) => {
                                                        const on = (draftPriv[feature.key] ?? []).includes(p.value);
                                                        return (
                                                            <Pressable
                                                                key={p.value}
                                                                style={styles.privRow}
                                                                onPress={() => togglePriv(feature.key, p.value, !on)}
                                                            >
                                                                <View style={styles.privText}>
                                                                    <Text style={styles.privTitle}>{p.label}</Text>
                                                                    <Text style={styles.privDesc}>{p.description}</Text>
                                                                </View>
                                                                <Switch
                                                                    value={on}
                                                                    onValueChange={(v) => togglePriv(feature.key, p.value, v)}
                                                                    color={colors.primary}
                                                                />
                                                            </Pressable>
                                                        );
                                                    })}
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Pinned footer */}
                        <View style={styles.modalFooter}>
                            <Button mode="text" onPress={() => setEditing(null)} textColor={colors.text}>
                                Cancel
                            </Button>
                            <Button mode="contained" onPress={onSave} style={styles.saveButton}>
                                {saving ? <ActivityIndicator color={colors.onPrimary} /> : "Save"}
                            </Button>
                        </View>
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
            borderRadius: 16,
            backgroundColor: colors.background,
            width: xl ? 560 : 440,
            maxWidth: "94%",
            overflow: "hidden",
            // Single intentional card shadow (shadows-over-borders).
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowRadius: 32,
            shadowOpacity: 0.18,
            elevation: 12,
        },
        // ── Pinned header ──
        modalHeader: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            gap: 8,
            backgroundColor: colors.background,
            // Toolbar pattern: cast a downward shadow over the scrolling body.
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.06,
            elevation: 3,
            zIndex: 2,
        },
        modalHeaderText: {
            flex: 1,
            gap: 2,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: "700",
        },
        modalSubtitle: {
            fontSize: 13,
            opacity: 0.6,
        },
        closeButton: {
            margin: 0,
            marginTop: -4,
            marginRight: -8,
        },
        // ── Pinned form region ──
        formRegion: {
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 14,
            backgroundColor: colors.background,
            zIndex: 1,
        },
        // ── Presets ──
        presetSection: {
            gap: 8,
        },
        presetLabel: {
            fontSize: 12,
            fontWeight: "600",
            opacity: 0.55,
            textTransform: "uppercase",
            letterSpacing: 0.4,
        },
        presetRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        presetChip: {
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: colors.tag,
        },
        presetChipActive: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            shadowOpacity: 0.3,
            elevation: 3,
        },
        presetChipText: {
            fontSize: 13,
            fontWeight: "600",
            color: colors.tagForeground,
        },
        presetChipTextActive: {
            color: colors.onPrimary,
        },
        // ── Scrollable body ──
        matrixScroll: {
            maxHeight: 420,
        },
        matrixContent: {
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 20,
            gap: 10,
        },
        featureCard: {
            borderRadius: 12,
            backgroundColor: colors.card,
            overflow: "hidden",
            // Card lift — shadow, not border.
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            shadowOpacity: 0.07,
            elevation: 3,
        },
        featureRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingRight: 14,
            paddingVertical: 8,
        },
        chevron: {
            margin: 0,
        },
        featureHeaderText: {
            flex: 1,
            gap: 2,
        },
        featureLabel: {
            fontSize: 15,
            fontWeight: "700",
        },
        featureDesc: {
            fontSize: 12,
            opacity: 0.55,
        },
        privList: {
            paddingHorizontal: 16,
            paddingBottom: 10,
            paddingTop: 2,
            gap: 2,
            backgroundColor: colors.tag,
        },
        privRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingVertical: 8,
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
        defaultNoteWrap: {
            paddingHorizontal: 20,
            paddingVertical: 24,
        },
        defaultNote: {
            fontSize: 14,
            opacity: 0.7,
            lineHeight: 20,
        },
        // ── Pinned footer ──
        modalFooter: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: colors.background,
            // Floating footer casts an upward shadow over the body it overlays.
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            shadowOpacity: 0.05,
            elevation: 4,
            zIndex: 2,
        },
        saveButton: {
            alignItems: "center",
        },
    });
}

export default TeamsTab;
