import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Theme, useTheme } from "@react-navigation/native";
import React, { PropsWithChildren } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

interface BottomSheetContainerProps extends PropsWithChildren {
    isVisible: boolean;
    snapPointsRange: [string, string];
    onClose: () => void;
}

const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({
    isVisible,
    snapPointsRange,
    onClose,
    children,
}) => {
    const sheetRef = React.useRef<BottomSheet>(null);

    const theme = useTheme();
    const styles = stylesFn(theme);

    const snapPoints = React.useMemo(
        () => [snapPointsRange[0], snapPointsRange[1]],
        []
    );

    const handleClose = () => {
        if (sheetRef.current) {
            sheetRef.current.close();
        }
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.bottomSheetContainer}>
                <BottomSheet
                    ref={sheetRef}
                    index={0}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    backdropComponent={() => {
                        return <Pressable style={styles.overlay} onPress={handleClose} />;
                    }}
                    onClose={handleClose}
                    style={styles.bottomSheet}
                >
                    <BottomSheetView>
                        {children}
                    </BottomSheetView>
                </BottomSheet>
            </View>
        </Modal>
    );
};

export default BottomSheetContainer;

const stylesFn = (theme: Theme) => StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    bottomSheetContainer: {
        flex: 1,
        justifyContent: "flex-end",
        zIndex: 2,
    },
    bottomSheet: {
        zIndex: 9999,
    },
});
