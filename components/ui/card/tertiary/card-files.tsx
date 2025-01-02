import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type File = {
  name: string;
  type: string;
};

type CardFilesProps = {
  files: File[];
  onFilePress?: (file: File) => void;
};

export const CardFiles = ({ files, onFilePress }: CardFilesProps) => {
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
          <Feather
            name={getFileIcon(file.type)}
            size={20}
            color="#6B7280"
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
