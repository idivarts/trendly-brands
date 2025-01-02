import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { faChartLine, faFaceSmile, faPeopleRoof } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme } from '@react-navigation/native';

type CardActionsProps = {
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
  action?: React.ReactNode;
};

export const CardActions = ({
  metrics,
  action = null,
}: CardActionsProps) => {
  const theme = useTheme();

  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num;
  };

  return (
    <View style={styles.container}>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <FontAwesomeIcon
            icon={faPeopleRoof}
            color={Colors(theme).primary}
            size={16}
          />
          <Text style={styles.metricText}>{formatNumber(metrics.views)}</Text>
        </View>
        <View style={styles.metric}>
          <FontAwesomeIcon
            icon={faChartLine}
            color={Colors(theme).primary}
            size={16}
          />
          <Text style={styles.metricText}>{formatNumber(metrics.likes)}</Text>
        </View>
        <View style={styles.metric}>
          <FontAwesomeIcon
            icon={faFaceSmile}
            color={Colors(theme).primary}
            size={16}
          />
          <Text style={styles.metricText}>{formatNumber(metrics.comments)}</Text>
        </View>
      </View>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metricText: {
    marginLeft: 4,
    fontSize: 14,
  },
});
