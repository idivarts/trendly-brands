import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFile } from '@fortawesome/free-regular-svg-icons';

type File = {
  url: string;
  name: string;
  type: string;
};

type CardFilesProps = {
  files: File[];
  onFilePress?: (file: File) => void;
};

export const CardFiles = ({ files, onFilePress }: CardFilesProps) => {
  const theme = useTheme();

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'file-text';
      case 'txt':
        return 'file';
      default:
        return 'file';
    }
  };

  return (
    <View style={styles.container}>
      {files.map((file, index) => (
        <TouchableOpacity
          key={index}
          style={styles.fileRow}
          onPress={() => onFilePress?.(file)}
        >
          <FontAwesomeIcon
            icon={faFile}
            size={20}
            color={Colors(theme).text}
          />
          <Text style={styles.fileName}>{file.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    textDecorationLine: 'underline',
  },
});
