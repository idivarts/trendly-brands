import { Text, View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { imageUrl } from '@/utils/url';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Theme, useTheme } from '@react-navigation/native';
import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';

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
      {(rightAction || timestamp) &&
        <View
          style={{
            gap: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors(theme).transparent,
          }}
        >
          {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
          {rightAction &&
            <Pressable
              onPress={rightAction}
            >
              <FontAwesomeIcon
                icon={faEllipsis}
                color={Colors(theme).primary}
                size={20}
              />
            </Pressable>}
        </View>}
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
    // maxWidth: '70%',
  },
  nameContainer: {
    // flexDirection: 'row',
    width: '100%',
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
