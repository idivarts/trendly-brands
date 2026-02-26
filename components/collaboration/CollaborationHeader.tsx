import Colors from "@/shared-uis/constants/Colors";
import ReadMore from "@/shared-uis/components/ReadMore";
import { imageUrl } from "@/utils/url";
import { faArrowLeft, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme, type Theme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Avatar } from "react-native-paper";
import BottomSheetActions from "../BottomSheetActions";
import { View } from "../theme/Themed";
import { CollaborationDetail } from "./collaboration-details";

interface ColloborationHeaderProps {
    collaboration: CollaborationDetail;
}

const CollaborationHeader: React.FC<ColloborationHeaderProps> = ({
    collaboration,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const pageID = useLocalSearchParams().pageID;
    const theme = useTheme();
    const styles = useMemo(() => useCollaborationHeaderStyles(theme), [theme]);
    const router = useRouter();

    return (
        <>
            <View style={styles.container}>
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
                            <ReadMore text={collaboration?.name} lineCount={1} showReadMore={false} style={styles.title} />
                            {/* <Text style={styles.title}>{collaboration?.name}</Text> */}
                            <View style={styles.companyRow}>
                                <ReadMore text={collaboration?.brandName} lineCount={1} showReadMore={false} style={styles.companyText} />
                                {/* <Text style={styles.companyText}>{collaboration?.brandName}</Text> */}
                            </View>
                        </View>
                    </View>
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
        companyText: {
            fontSize: 14,
            color: Colors(theme).text,
        },
        iconButton: {
            paddingRight: 16,
        },
        tagsContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
        },
    });
}

export default CollaborationHeader;
