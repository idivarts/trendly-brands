import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useBrandContext } from "@/contexts/brand-context.provider";
import { useBreakpoints } from "@/hooks";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { createTeam, deleteTeam, listTeams, renameTeam, Team } from "./api";

const TeamsTab: React.FC = () => {
    const theme = useTheme();
    const colors = useMemo(() => Colors(theme), [theme]);
    const { xl, width } = useBreakpoints();
    const styles = useMemo(() => createStyles(colors, xl, width), [colors, xl, width]);
    const { selectedBrand } = useBrandContext();

    const [teams, setTeams] = useState<Team[]>([]);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [renaming, setRenaming] = useState<Team | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const fetchTeams = async () => {
        if (!selectedBrand) return;
        listTeams(selectedBrand.id).then(setTeams).catch(() => setTeams([]));
    };

    useEffect(() => {
        fetchTeams();
    }, [selectedBrand]);

    const onCreate = async () => {
        if (!selectedBrand || newName.trim().length < 2) {
            Toaster.error("Enter a team name");
            return;
        }
        setCreating(true);
        try {
            await createTeam(selectedBrand.id, newName.trim());
            Toaster.success("Team created");
            setNewName("");
            fetchTeams();
        } catch (e) {
            Toaster.error("Couldn't create team");
            Console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const onRename = async () => {
        if (!selectedBrand || !renaming || renameValue.trim().length < 2) return;
        try {
            await renameTeam(selectedBrand.id, renaming.id, renameValue.trim());
            Toaster.success("Team renamed");
            setRenaming(null);
            fetchTeams();
        } catch (e) {
            Toaster.error("Couldn't rename team");
            Console.error(e);
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

    const renderRow = ({ item }: { item: Team }) => (
        <View style={styles.row}>
            <View style={styles.rowBody}>
                <Text style={styles.name}>{item.name}</Text>
                {item.isDefault ? <Text style={styles.defaultTag}>Default team</Text> : null}
            </View>
            {!item.isDefault ? (
                <View style={styles.actions}>
                    <Pressable
                        onPress={() => {
                            setRenaming(item);
                            setRenameValue(item.name);
                        }}
                    >
                        <Text style={styles.actionText}>Rename</Text>
                    </Pressable>
                    <Pressable onPress={() => onDelete(item)}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.createBar}>
                <View style={styles.createInput}>
                    <TextInput
                        label="New team name"
                        mode="outlined"
                        value={newName}
                        onChangeText={setNewName}
                    />
                </View>
                <Button mode="contained" onPress={onCreate}>
                    {creating ? <ActivityIndicator color={colors.onPrimary} /> : "Add team"}
                </Button>
            </View>

            <FlatList
                data={teams}
                renderItem={renderRow}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
            />

            <Portal>
                <Modal visible={!!renaming} onDismiss={() => setRenaming(null)} style={styles.modalRoot}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename team</Text>
                        <TextInput label="Team name" mode="outlined" value={renameValue} onChangeText={setRenameValue} />
                        <Button mode="contained" onPress={onRename}>
                            Save
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
        createBar: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        createInput: {
            flex: 1,
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
            gap: 2,
        },
        name: {
            fontSize: 15,
            fontWeight: "600",
        },
        defaultTag: {
            fontSize: 12,
            opacity: 0.55,
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
            width: 320,
            maxWidth: "92%",
        },
        modalTitle: {
            fontSize: 16,
            fontWeight: "700",
        },
    });
}

export default TeamsTab;
