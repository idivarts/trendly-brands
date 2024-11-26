import { imageUrl } from '@/utils/url';
import React from 'react';
import { Avatar } from 'react-native-paper';
import Tag from '../ui/tag';
import { Text, View } from '../theme/Themed';
import { useTheme } from '@react-navigation/native';
import { stylesFn } from '@/styles/collaboration-details/CollaborationHeader.styles';
import { CollaborationDetail } from './collaboration-details';

interface ColloborationHeaderProps {
  collaboration: CollaborationDetail;
}

const CollaborationHeader: React.FC<ColloborationHeaderProps> = ({
  collaboration,
}) => {
  const theme = useTheme();
  const styles = stylesFn(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Avatar.Image
            size={48}
            source={imageUrl(collaboration?.logo)}
          />
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {collaboration?.name}
            </Text>
            <View style={styles.companyRow}>
              <Text style={styles.companyText}>
                {collaboration?.brandName}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {
          collaboration.promotionType && (
            <Tag
              icon="checkbox-marked-circle"
            >
              {collaboration.promotionType}
            </Tag>
          )
        }
        {
          collaboration.collaborationType && (
            <Tag
              icon="eye"
            >
              {collaboration.collaborationType}
            </Tag>
          )
        }
        <Tag
          icon="map-marker"
        >
          {
            collaboration.location.type === "Remote"
              ? "Remote"
              : collaboration.location.name
          }
        </Tag>
      </View>
    </View>
  )
};

export default CollaborationHeader;
