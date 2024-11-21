import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Searchbar } from "react-native-paper";
import Colors from "@/constants/Colors";
import { Theme, useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSliders } from "@fortawesome/free-solid-svg-icons";

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
  const styles = stylesFn(theme);

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
        style={styles.searchInput}
        iconColor={Colors(theme).gray100}
      />
      <Pressable
        onPress={() => {
          if (ToggleModal) ToggleModal(true);
        }}
        style={styles.filterButton}
      >
        <FontAwesomeIcon
          color={Colors(theme).white}
          icon={faSliders}
          size={24}
        />
      </Pressable>
    </View>
  );
};

const stylesFn = (theme: Theme) => StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    gap: 12,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    borderRadius: 15,
    backgroundColor: Colors(theme).aliceBlue,
  },
  filterButton: {
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors(theme).primary,
  }
});

export default SearchComponent;
