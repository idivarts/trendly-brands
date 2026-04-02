import Button from "@/components/ui/button";
import { Text } from "@/components/theme/Themed";
import Colors from "@/shared-uis/constants/Colors";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

const DISCLAIMER =
    "By clicking Create Brand, you agree to our Terms of Service.";
const DEFAULT_LABEL = "Create Brand";

export interface CreateBrandFooterProps {
    onPress: () => void;
    loading?: boolean;
    buttonLabel?: string;
}

const CreateBrandFooter: React.FC<CreateBrandFooterProps> = ({
    onPress,
    loading = false,
    buttonLabel = DEFAULT_LABEL,
}) => {
    const theme = useTheme();
    const colors = Colors(theme);
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.wrapper}>
            <Button
                mode="contained"
                onPress={onPress}
                loading={loading}
                style={styles.button}
            >
                {buttonLabel}
            </Button>
            <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        </View>
    );
};

function createStyles(colors: ReturnType<typeof Colors>) {
    return StyleSheet.create({
        wrapper: {
            paddingTop: 32,
            width: "100%",
            alignItems: "stretch",
        },
        button: {
            alignSelf: "stretch",
            paddingVertical: 16,
            borderRadius: 12,
        },
        disclaimer: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 16,
            textAlign: "center",
        },
    });
}

export default CreateBrandFooter;
