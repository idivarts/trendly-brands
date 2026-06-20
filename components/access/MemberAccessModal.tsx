import { Text, View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import { Console } from "@/shared-libs/utils/console";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import Colors from "@/shared-uis/constants/Colors";
import { type Theme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Modal, Portal } from "react-native-paper";
import AccessControls from "./AccessControls";
import { removeMember, Team, updateMemberAccess } from "./api";

export interface EditableMember {
    managerId: string;
    name?: string;
    email?: string;
    teamId?: string;
    status: number;
}

interface MemberAccessModalProps {
    visible: boolean;
    onClose: () => void;
    theme: Theme;
    brandId: string;
    member: EditableMember | null;
    teams: Team[];
    onSaved: () => void;
}

const MemberAccessModal: React.FC<MemberAccessModalProps> = ({
    visible,
    onClose,
    theme,
    brandId,
    member,
    teams,
    onSaved,
}) => {
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    const defaultTeamId = useMemo(
        () => teams.find((t) => t.isDefault)?.id ?? teams[0]?.id ?? "",
        [teams]
    );
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!member) return;
        setSelectedTeamId(member.teamId || defaultTeamId);
    }, [member, defaultTeamId]);

    const save = async () => {
        if (!member) return;
        if (!selectedTeamId) {
            Toaster.error("Pick a team for this member");
            return;
        }
        setSaving(true);
        try {
            await updateMemberAccess(brandId, member.managerId, {
                teamId: selectedTeamId,
            });
            Toaster.success("Access updated");
            onSaved();
            onClose();
        } catch (e) {
            Toaster.error("Couldn't update access");
            Console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!member) return;
        setSaving(true);
        try {
            await removeMember(brandId, member.managerId);
            Toaster.success("Member removed");
            onSaved();
            onClose();
        } catch (e) {
            Toaster.error("Couldn't remove member");
            Console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose} style={styles.modalRoot}>
                <View style={styles.content}>
                    <Text style={styles.title}>{member?.name || member?.email || "Member"}</Text>
                    {member?.email ? <Text style={styles.subtitle}>{member.email}</Text> : null}

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        <AccessControls
                            theme={theme}
                            teams={teams}
                            selectedTeamId={selectedTeamId}
                            onTeamChange={setSelectedTeamId}
                        />
                    </ScrollView>

                    <Button mode="contained" onPress={save} style={styles.saveButton}>
                        {saving ? <ActivityIndicator color={colors.onPrimary} /> : "Save changes"}
                    </Button>
                    <Button mode="text" onPress={remove} textColor={colors.red}>
                        Remove from brand
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        modalRoot: {
            justifyContent: "center",
            alignItems: "center",
        },
        content: {
            padding: 16,
            gap: 8,
            borderRadius: 12,
            backgroundColor: colors.background,
            width: 380,
            maxWidth: "92%",
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
        },
        subtitle: {
            fontSize: 13,
            opacity: 0.6,
        },
        scroll: {
            maxHeight: 460,
        },
        scrollContent: {
            paddingBottom: 8,
        },
        saveButton: {
            marginTop: 8,
            alignItems: "center",
        },
    });
}

export default MemberAccessModal;
