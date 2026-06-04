import { View } from "@/components/theme/Themed";
import PageHeader from "@/components/ui/page-header";
import AppLayout from "@/layouts/app-layout";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import ContentGallery from "./ContentGallery";
import { ContentItem } from "./types";

interface ContentLibraryViewProps {
    title: string;
    subtitle?: string;
    items: ContentItem[];
    emptyText: string;
}

/**
 * Gallery-only page used by the triple-dot library routes (Scheduled / Posted /
 * Archived). No Board view and no state filter — the status set is fixed.
 */
const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({
    title,
    subtitle,
    items,
    emptyText,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const router = useRouter();
    const styles = useMemo(() => useStyles(colors), [colors]);

    const handleOpenContent = (item: ContentItem) => {
        router.push(`/contents/${item.id}` as any);
    };

    return (
        <AppLayout>
            <PageHeader title={title} subtitle={subtitle} showBackButton mobileActions="all" />
            <View style={styles.flex1}>
                <ContentGallery
                    items={items}
                    onPressItem={handleOpenContent}
                    emptyText={emptyText}
                />
            </View>
        </AppLayout>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                flex1: { flex: 1 },
            }),
        [colors]
    );
}

export default ContentLibraryView;
