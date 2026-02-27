import Colors from "@/shared-uis/constants/Colors";
import ReadMore from "@/shared-uis/components/ReadMore";
import { imageUrl } from "@/utils/url";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme, type Theme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar } from "react-native-paper";
import BottomSheetActions from "../BottomSheetActions";
import Button from "../ui/button";
import { View as ThemedView } from "../theme/Themed";
import { CollaborationDetail } from "./collaboration-details";

interface ColloborationHeaderProps {
    collaboration: CollaborationDetail;
    isDraft?: boolean;
    onEditDraft?: () => void;
    onPublish?: () => void;
}

const CollaborationHeader: React.FC<ColloborationHeaderProps> = ({
    collaboration,
    isDraft,
    onEditDraft,
    onPublish,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const pageID = useLocalSearchParams().pageID;
    const theme = useTheme();
    const styles = useMemo(() => useCollaborationHeaderStyles(theme), [theme]);
    const router = useRouter();

    return (
        <>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => {
                        if (router.canGoBack())
                            router.back();
                        else
                            router.push("/collaborations");
                    }} style={styles.iconButton}>
                        <FontAwesomeIcon
                            icon={faArrowLeft}
                            size={24}
                            color={Colors(theme).text}
                        />
                    </Pressable>
                    <View style={styles.logoSection}>
                        <Avatar.Image size={48} source={imageUrl(collaboration?.logo)} />
                        <View style={styles.titleSection}>
                            <View style={styles.companyRow}>
                                <ReadMore text={collaboration?.brandName ?? ""} lineCount={1} showReadMore={false} style={styles.brandNameOnly} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {isDraft && onEditDraft && onPublish && (
                            <>
                                <Button
                                    mode="contained"
                                    onPress={onEditDraft}
                                    size="small"
                                    style={styles.draftActionButton}
                                    textColor={Colors(theme).text}
                                >
                                    Edit Draft
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={onPublish}
                                    size="small"
                                    style={styles.publishActionButton}
                                >
                                    Publish Now
                                </Button>
                            </>
                        )}
                        <Pressable onPress={() => {
                            setIsVisible(true)
                        }} style={styles.iconButton}>
                            <FontAwesomeIcon
                                icon={faEllipsisH}
                                size={24}
                                color={Colors(theme).text}
                            />
                        </Pressable>
                    </View>
                </View>
            </ThemedView>
            <BottomSheetActions
                cardId={pageID as string}
                cardType="activeCollab"
                isVisible={isVisible}
                snapPointsRange={["20%", "50%"]}
                onClose={() => {
                    setIsVisible(false);
                }}
        />
    </>
    );
};

function useCollaborationHeaderStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: 16,
            marginTop: 16
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        logoSection: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
        },
        titleSection: {
            flex: 1,
            gap: 4,
        },
        title: {
            fontSize: 18,
            fontWeight: "600",
            color: Colors(theme).text,
        },
        companyRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        brandNameOnly: {
            fontSize: 18,
            fontWeight: "600",
            color: Colors(theme).text,
        },
        companyText: {
            fontSize: 14,
            color: Colors(theme).text,
        },
        iconButton: {
            paddingRight: 16,
        },
        headerRight: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        draftActionButton: {
            backgroundColor: Colors(theme).background,
            borderWidth: 0.3,
            borderColor: Colors(theme).outline,
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
        },
        publishActionButton: {
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            minHeight: 32,
        },
        tagsContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
        },
    });
}

export default CollaborationHeader;
