import useBreakpoints from "@/shared-libs/utils/use-breakpoints";
import BottomSheetScrollContainer from "@/shared-uis/components/bottom-sheet/scroll-view";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { PropsWithChildren, useMemo } from "react";
import { Platform, Modal as RNModal, StyleSheet, View } from "react-native";
import { Modal as PaperModal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SnapPointsRange = [string, string];

export type ContractActionOverlayMode = "auto" | "modal" | "bottomSheet";

export interface ContractActionOverlayProps extends PropsWithChildren {
    visible: boolean;
    onClose: () => void;
    /**
     * - `auto`: `xl` → modal, `!xl` → bottom sheet
     * - `modal`: always modal (RNModal on native, Portal+PaperModal on web)
     * - `bottomSheet`: always bottom sheet
     */
    mode?: ContractActionOverlayMode;
    /** Used when rendering as bottom sheet (default provided). */
    snapPointsRange?: SnapPointsRange;
    /** Used when rendering modal on web. */
    modalMaxWidth?: number;
}

const DEFAULT_SNAP_POINTS: SnapPointsRange = ["40%", "85%"];

export default function ContractActionOverlay({
    visible,
    onClose,
    mode = "auto",
    snapPointsRange = DEFAULT_SNAP_POINTS,
    modalMaxWidth = 520,
    children,
}: ContractActionOverlayProps) {
    const theme = useTheme();
    const colors = Colors(theme);
    const insets = useSafeAreaInsets();
    const { xl } = useBreakpoints();

    const resolvedMode: ContractActionOverlayMode =
        mode === "auto" ? (xl ? "modal" : "bottomSheet") : mode;

    const styles = useMemo(
        () => createStyles(colors, modalMaxWidth, insets.top),
        [colors, modalMaxWidth, insets.top]
    );

    if (resolvedMode === "bottomSheet") {
        return (
            <BottomSheetScrollContainer
                isVisible={visible}
                snapPointsRange={snapPointsRange}
                onClose={onClose}
            >
                <View style={styles.sheetContainer}>{children}</View>
            </BottomSheetScrollContainer>
        );
    }

    if (Platform.OS !== "web") {
        return (
            <RNModal
                visible={visible}
                animationType="slide"
                onRequestClose={onClose}
                statusBarTranslucent
            >
                <View style={styles.nativeModalContainer}>{children}</View>
            </RNModal>
        );
    }

    return (
        <Portal>
            <PaperModal
                visible={visible}
                onDismiss={onClose}
                contentContainerStyle={styles.webModalContainer}
            >
                {children}
            </PaperModal>
        </Portal>
    );
}

function createStyles(
    colors: ReturnType<typeof Colors>,
    modalMaxWidth: number,
    safeAreaTop: number
) {
    return StyleSheet.create({
        sheetContainer: {
            flexGrow: 1,
            backgroundColor: colors.background,
        },
        nativeModalContainer: {
            flex: 1,
            backgroundColor: colors.background,
            paddingTop: Math.max(safeAreaTop, 16),
        },
        webModalContainer: {
            backgroundColor: colors.background,
            borderRadius: 12,
            marginHorizontal: 24,
            // `alignSelf: "center"` alone shrinks to content width; `width: "100%"` fills
            // the overlay so `maxWidth` actually governs desktop modal width.
            width: "100%",
            maxWidth: modalMaxWidth,
            alignSelf: "center",
            overflow: "hidden",
        },
    });
}

