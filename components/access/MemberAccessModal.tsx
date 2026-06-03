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
    role?: string;
    teamIds?: string[];
    overrides?: Record<string, boolean>;
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

    const [role, setRole] = useState("viewer");
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    const isOwner = member?.role === "owner";

    useEffect(() => {
        if (!member) return;
        setRole(member.role && member.role !== "owner" ? member.role : "viewer");
        setSelectedTeamIds(member.teamIds ?? []);
        setOverrides(member.overrides ?? {});
    }, [member]);

    const save = async () => {
        if (!member) return;
        setSaving(true);
        try {
            await updateMemberAccess(brandId, member.managerId, {
                role,
                teamIds: selectedTeamIds,
                overrides,
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

                    {isOwner ? (
                        <Text style={styles.ownerNotice}>
                            This member is the Owner. Transfer ownership to change their role.
                        </Text>
                    ) : (
                        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                            <AccessControls
                                theme={theme}
                                role={role}
                                onRoleChange={setRole}
                                teams={teams}
                                selectedTeamIds={selectedTeamIds}
                                onTeamsChange={setSelectedTeamIds}
                                overrides={overrides}
                                onOverridesChange={setOverrides}
                            />
                        </ScrollView>
                    )}

                    {!isOwner && (
                        <Button mode="contained" onPress={save} style={styles.saveButton}>
                            {saving ? <ActivityIndicator color={colors.onPrimary} /> : "Save changes"}
                        </Button>
                    )}
                    {!isOwner && (
                        <Button mode="text" onPress={remove} textColor={colors.red}>
                            Remove from brand
                        </Button>
                    )}
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
        ownerNotice: {
            fontSize: 13,
            opacity: 0.7,
            marginVertical: 12,
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
