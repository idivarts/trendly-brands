import React from 'react';
import { Image, StyleSheet, Pressable } from 'react-native';
import { Theme, useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import Colors from '@/constants/Colors';
import { Avatar } from 'react-native-paper';
import { imageUrl } from '@/utils/url';
import { Text, View } from '@/components/theme/Themed';

type CardHeaderProps = {
  avatar: string;
  handle?: string;
  isVerified?: boolean;
  leftAction?: () => void;
  name: string;
  rightAction?: () => void;
  timestamp?: string;
};

export const CardHeader = ({
  avatar,
  handle,
  isVerified = false,
  leftAction,
  name,
  rightAction,
  timestamp,
}: CardHeaderProps) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.header}>
      <Pressable
        style={styles.leftContent}
        onPress={leftAction}
      >
        {avatar ? (
          <Avatar.Image size={48} source={imageUrl(avatar)} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{name?.[0] || 'U'}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{name}</Text>
            {isVerified && (
              <Image
                source={require('@/assets/icons/verified.png')}
                style={styles.verifiedBadge}
              />
            )}
          </View>
          <Text style={styles.handle}>{handle || '@socialmedia'}</Text>
        </View>
      </Pressable>
      <View
        style={{
          gap: 12,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors(theme).transparent,
        }}
      >
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
        <Pressable
          onPress={rightAction}
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            color={Colors(theme).primary}
            size={20}
          />
        </Pressable>
      </View>
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors(theme).transparent,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 100,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: Colors(theme).aliceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    color: Colors(theme).primary,
  },
  userInfo: {
    marginLeft: 12,
    backgroundColor: Colors(theme).transparent,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors(theme).transparent,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    marginLeft: 4,
    width: 22,
    height: 22,
  },
  handle: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 14,
  },
});
