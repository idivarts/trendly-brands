import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Searchbar, TextInput } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";

interface SearchComponentProps {
  ToggleModal?: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  ToggleModal,
  setSearchQuery,
}) => {
  const [localQuery, setLocalQuery] = useState("");
  const theme = useTheme();

  const handleChangeText = (query: string) => {
    setLocalQuery(query);
    setSearchQuery(query);
  };

  const handleClearText = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <View style={[styles.searchContainer]}>
      <Searchbar
        placeholder="Search"
        placeholderTextColor={Colors(theme).gray100}
        value={localQuery}
        onChangeText={handleChangeText}
        style={[
          styles.searchInput,
          { backgroundColor: Colors(theme).platinum },
        ]}
        iconColor={Colors(theme).gray100}
      />
      <TouchableOpacity
        onPress={() => {
          if (ToggleModal) ToggleModal(true);
        }}
      >
        <Ionicons
          name="options-outline"
          size={24}
          color={Colors(theme).text}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,

    width: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    marginHorizontal: 5,
  },
});

export default SearchComponent;
