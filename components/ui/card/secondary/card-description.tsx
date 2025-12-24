import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import RenderHTML from 'react-native-render-html';

type CardDescriptionProps = {
    text: string;
};

export const CardDescription = ({ text }: CardDescriptionProps) => {
    const theme = useTheme();
    const styles = stylesFn(theme);
    const screenWidth = Dimensions.get("window").width;

    return (
        <View style={styles.container}>
            <Text>
                <RenderHTML
                    contentWidth={screenWidth}
                    source={{
                        html: text || "",
                    }}
                    baseStyle={{
                        color: Colors(theme).text,
                        fontSize: 14,
                        lineHeight: 20,
                    }}
                />
            </Text>
        </View>
    );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
    container: {
        marginTop: 8,
        paddingHorizontal: 16,
        backgroundColor: Colors(theme).transparent,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
});
