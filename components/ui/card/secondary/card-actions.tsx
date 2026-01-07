import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { convertToKUnits } from '@/utils/conversion';
import { faChartLine, faFaceSmile, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

type CardActionsProps = {
    metrics: {
        followers: number;
        reach: number;
        rating: number;
    };
    action?: React.ReactNode;
};

export const CardActions = ({
    metrics,
    action = null,
}: CardActionsProps) => {
    const theme = useTheme();
    const styles = stylesFn(theme);

    return (
        <View style={styles.container}>
            <View style={styles.metrics}>
                <View style={styles.metric}>
                    <FontAwesomeIcon
                        icon={faPeopleRoof}
                        color={Colors(theme).primary}
                        size={16}
                    />
                    <Text style={styles.metricText}>{convertToKUnits(metrics.followers)}</Text>
                </View>
                <View style={styles.metric}>
                    <FontAwesomeIcon
                        icon={faChartLine}
                        color={Colors(theme).primary}
                        size={16}
                    />
                    <Text style={styles.metricText}>{convertToKUnits(metrics.reach)}</Text>
                </View>
                <View style={styles.metric}>
                    <FontAwesomeIcon
                        icon={faFaceSmile}
                        color={Colors(theme).primary}
                        size={16}
                    />
                    <Text style={styles.metricText}>{convertToKUnits(metrics.rating)}</Text>
                </View>
            </View>
            {action}
        </View>
    );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: Colors(theme).transparent,
    },
    metrics: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors(theme).transparent,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: Colors(theme).transparent,
    },
    metricText: {
        marginLeft: 4,
        fontSize: 14,
    },
});
