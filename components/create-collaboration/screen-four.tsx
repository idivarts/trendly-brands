import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Title } from "react-native-paper";

import Colors from "@/constants/Colors";
import stylesFn from "@/styles/modal/UploadModal.styles";
import { Text, View } from "../theme/Themed";

interface ScreenFourProps {
    type: "Add" | "Edit";
}

const ScreenFour: React.FC<ScreenFourProps> = ({
    type,
}) => {
    const theme = useTheme();
    const styles = stylesFn(theme);

    return (
        <>
            <View style={styles.container3}>
                <FontAwesomeIcon
                    icon={faCheckCircle}
                    size={100}
                    color={Colors(theme).primary}
                    style={styles.checkIcon}
                />
                <Title style={styles.title}>
                    Collaboration {type === "Add" ? "Posted" : "Updated"}
                </Title>
                <Text style={styles.description}>
                    Your collaboration has been successfully {type === "Add" ? "posted" : "updated"}.
                </Text>
            </View>
        </>
    );
};

export default ScreenFour;
