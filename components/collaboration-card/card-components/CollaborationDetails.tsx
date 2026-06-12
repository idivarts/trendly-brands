import { Text, View } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { PromotionType } from "@/shared-libs/firestore/trendly-pro/constants/promotion-type";
import {
    CollaborationLocationType,
    getCollaborationLocationDisplayLabel,
    normalizeCollaborationLocationType,
} from "@/shared-libs/firestore/trendly-pro/models/collaborations";
import { truncateText } from "@/utils/text";
import {
    faFacebook,
    faInstagram,
    faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faHeart, faStarHalfStroke } from "@fortawesome/free-regular-svg-icons";
import {
    faDollarSign,
    faEllipsisH,
    faFilm,
    faHouseLaptop,
    faLocationDot,
    faPanorama,
    faRecordVinyl,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { FC, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import ChipCard from "./ChipComponent";

interface CollaborationDetailsProps {
    collabDescription: string;
    name: string;
    collabId: string;
    location: any;
    platform: string[];
    contentType: string[];
    promotionType: PromotionType;
    onOpenBottomSheet?: (id: string) => void;
}

const CollaborationDetails: FC<CollaborationDetailsProps> = ({
    collabDescription,
    name,
    collabId,
    location,
    platform,
    contentType,
    promotionType,
    onOpenBottomSheet,
}) => {
    const theme = useTheme();
    const router = useRouter();
    const styles = useStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                    <Text style={styles.nameText}>
                        {name}
                    </Text>
                </View>
                {onOpenBottomSheet && (
                    <Pressable
                        onPress={() => {
                            onOpenBottomSheet(collabId);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faEllipsisH}
                            color={Colors(theme).primary}
                            size={24}
                        />
                    </Pressable>)}
            </View>
            <View>
                <Text style={styles.descriptionText}>
                    {truncateText(collabDescription, 120)}
                </Text>
                <View style={styles.chipsRow}>
                    <ChipCard
                        chipText={
                            promotionType === PromotionType.PAID_COLLAB ? "Paid" : "Unpaid"
                        }
                        chipIcon={faDollarSign}
                    />
                    <ChipCard
                        chipText={getCollaborationLocationDisplayLabel(
                            location.type
                        )}
                        chipIcon={
                            normalizeCollaborationLocationType(location.type) ===
                            CollaborationLocationType.OnSite
                                ? faLocationDot
                                : faHouseLaptop
                        }
                    />
                    {platform &&
                        platform.map((content, index) => (
                            <ChipCard
                                key={index}
                                chipText={content}
                                chipIcon={
                                    content === "Instagram"
                                        ? faInstagram
                                        : content === "Facebook"
                                            ? faFacebook
                                            : content === "Youtube"
                                                ? faYoutube
                                                : faInstagram
                                }
                            />
                        ))}
                    {contentType &&
                        contentType.map((content, index) => (
                            <ChipCard
                                key={index}
                                chipText={content}
                                chipIcon={
                                    content === "Posts"
                                        ? faPanorama
                                        : content === "Reels"
                                            ? faFilm
                                            : content === "Stories"
                                                ? faHeart
                                                : content === "Live"
                                                    ? faRecordVinyl
                                                    : content === "Product Reviews"
                                                        ? faStarHalfStroke
                                                        : faPanorama
                                }
                            />
                        ))}
                </View>
            </View>
        </View>
    );
};

function useStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: Colors(theme).transparent,
            marginBottom: 12,
        },
        headerRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        titleWrap: {
            flex: 1,
        },
        nameText: {
            fontSize: 16,
            fontWeight: "bold",
            color: Colors(theme).text,
        },
        descriptionText: {
            color: Colors(theme).textSecondary,
        },
        chipsRow: {
            flexDirection: "row",
            marginTop: 10,
            flexWrap: "wrap",
            rowGap: 10,
        },
    });
}

export default CollaborationDetails;
