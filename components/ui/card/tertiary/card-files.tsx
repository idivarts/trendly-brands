import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';

import Colors from '@/constants/Colors';

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

  return (
    <View style={styles.container}>
      {files.map((file, index) => (
        <TouchableOpacity
          key={index}
          style={styles.fileRow}
          onPress={() => onFilePress?.(file)}
        >
          <FontAwesomeIcon
            icon={faPaperclip}
            size={20}
            style={{
              transform: [{ rotate: '-45deg' }],
            }}
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
    textDecorationLine: 'underline',
  },
});
