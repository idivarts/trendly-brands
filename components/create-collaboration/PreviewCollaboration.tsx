import { View } from "@/components/theme/Themed";
import Button from "@/components/ui/button";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { CollaborationDetail } from "../collaboration/collaboration-details";
import OverviewTabContent from "../collaboration/collaboration-details/OverviewTabContent";

interface PreviewProps {
    collaboration: Partial<CollaborationDetail>;
    isSubmitting: boolean;
    onEdit: () => void;
    onPublish: () => void;
    onSaveDraft: () => void;
}

const PreviewCollaboration: React.FC<PreviewProps> = ({
    collaboration,
    isSubmitting,
    onEdit,
    onPublish,
    onSaveDraft,
}) => {
    const theme = useTheme();

    return (
        <View style={{ flex: 1, padding: 16 }}>
            {/* REUSING THE SAME UI AS OVERVIEW TAB */}
            <OverviewTabContent collaboration={collaboration as any} />

            {/* ACTION BUTTONS */}
            <View
                style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 24,
                    justifyContent: "space-between",
                }}
            >
                <Button
                    mode="outlined"
                    style={{ flex: 1 }}
                    textColor={Colors(theme).text}
                    onPress={onEdit}
                    disabled={isSubmitting}
                >
                    Edit
                </Button>

                <Button
                    mode="contained"
                    style={{ flex: 1 }}
                    onPress={onSaveDraft}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    Save as Draft
                </Button>

                <Button
                    mode="contained"
                    style={{ flex: 1 }}
                    onPress={onPublish}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    Publish
                </Button>
            </View>
        </View>
    );
};

export default PreviewCollaboration;
