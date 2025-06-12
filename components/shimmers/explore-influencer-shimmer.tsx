import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

import AppLayout from '@/layouts/app-layout';
import Shimmer from '@/shared-uis/components/shimmer';
import { View } from '../theme/Themed';

const ExploreInfluencerShimmer = () => {
  const theme = useTheme();

  return (
    <AppLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Shimmer width={80} height={36} />
            <Shimmer width={20} height={20} />
          </View>
          <Shimmer width={22} height={22} />
        </View>

        <View style={styles.searchContainer}>
          <Shimmer width="100%" height={40} />
        </View>

        <View style={styles.profileSection}>
          <Shimmer width={50} height={50} />
          <View style={styles.profileInfo}>
            <Shimmer width={150} height={20} />
            <Shimmer width={100} height={16} />
          </View>
        </View>

        <Shimmer width="100%" height={300} />

        <View style={styles.metrics}>
          <Shimmer width={50} height={24} />
          <Shimmer width={50} height={24} />
        </View>

        <Shimmer width="100%" height={40} />

        <View style={styles.bottomNav}>
          {[...Array(5)].map((_, index) => (
            <Shimmer
              key={index}
              width={56}
              height={48}
            />
          ))}
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  profileInfo: {
    gap: 4,
  },
  metrics: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 'auto',
  },
});

export default ExploreInfluencerShimmer;
