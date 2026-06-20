import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import ContentGalleryCard from "./ContentGalleryCard";
import { ContentItem } from "./types";

interface ContentGalleryProps {
    items: ContentItem[];
    onPressItem: (item: ContentItem) => void;
    /** Message shown when there are no items to display. */
    emptyText?: string;
}

const GAP = 12;
const EDGE = 16; // horizontal padding on each side of the grid
const TARGET_CARD_WIDTH = 250; // desired card width; columns adapt around this

/**
 * Pick a column count so each card stays close to TARGET_CARD_WIDTH. Cards get a
 * FIXED width (below) so a partial last row left-aligns instead of stretching.
 */
function columnsForContainer(containerWidth: number): number {
    if (containerWidth < 360) return 1;
    const cols = Math.floor((containerWidth - EDGE * 2 + GAP) / (TARGET_CARD_WIDTH + GAP));
    return Math.max(2, Math.min(cols, 6));
}

/**
 * Full-width, media-first responsive grid of content cards. Measures its own
 * width, derives a column count, and renders fixed-width cards so the grid is
 * consistent regardless of how many items are in the final row.
 */
const ContentGallery: React.FC<ContentGalleryProps> = ({
    items,
    onPressItem,
    emptyText = "No content here yet.",
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useStyles(colors);
    const [containerWidth, setContainerWidth] = useState(0);

    const numColumns = containerWidth > 0 ? columnsForContainer(containerWidth) : 0;
    const itemWidth =
        numColumns > 0
            ? Math.floor((containerWidth - EDGE * 2 - GAP * (numColumns - 1)) / numColumns)
            : 0;

    return (
        <View
            style={styles.fill}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && w !== containerWidth) setContainerWidth(w);
            }}
        >
            {numColumns === 0 ? null : items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
            ) : (
                <FlatList
                    // Remount when the column count changes — FlatList can't
                    // change numColumns in place.
                    key={`grid-${numColumns}`}
                    data={items}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    renderItem={({ item }) => (
                        <View style={{ width: itemWidth }}>
                            <ContentGalleryCard item={item} onPress={onPressItem} />
                        </View>
                    )}
                    columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

function useStyles(colors: ReturnType<typeof Colors>) {
    return useMemo(
        () =>
            StyleSheet.create({
                fill: {
                    flex: 1,
                },
                list: {
                    padding: EDGE,
                    gap: GAP,
                    paddingBottom: 40,
                },
                row: {
                    gap: GAP,
                    justifyContent: "flex-start",
                },
                empty: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                emptyText: {
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: "center",
                },
            }),
        [colors]
    );
}

export default ContentGallery;
