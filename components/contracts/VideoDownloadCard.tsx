import { Text } from "@/components/theme/Themed";
import Colors from "@/constants/Colors";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

interface VideoDownloadCardProps {
    videoUrl?: string;
    videoTitle?: string;
    onDownload: () => void;
    downloading?: boolean;
}

const VideoDownloadCard: React.FC<VideoDownloadCardProps> = ({
    videoUrl,
    videoTitle = "Video Received",
    onDownload,
    downloading = false,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors(theme).gray200 }]}>
            <View style={styles.content}>
                <View style={styles.textSection}>
                    <Text style={[styles.title, { color: Colors(theme).text }]}>
                        {videoTitle}
                    </Text>
                    <Text style={[styles.description, { color: Colors(theme).gray300 }]}>
                        Note will be put there full details here
                    </Text>
                </View>
                <View style={styles.placeholderIcons}>
                    <View style={[styles.iconPlaceholder, { backgroundColor: Colors(theme).gray100 }]} />
                    <View style={[styles.iconPlaceholder, { backgroundColor: Colors(theme).gray100 }]} />
                    <View style={[styles.iconPlaceholder, { backgroundColor: Colors(theme).gray100 }]} />
                </View>
            </View>

            {/* Download Button */}
            <Button
                icon={() => (
                    <FontAwesomeIcon
                        icon={faDownload}
                        size={18}
                        color={Colors(theme).text}
                    />
                )}
                mode="outlined"
                onPress={onDownload}
                loading={downloading}
                disabled={downloading}
                style={styles.downloadButton}
            >
                Download
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        gap: 16,
        marginBottom: 16,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },
    textSection: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    placeholderIcons: {
        flexDirection: "row",
        gap: 8,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    downloadButton: {
        borderRadius: 12,
    },
});

export default VideoDownloadCard;
