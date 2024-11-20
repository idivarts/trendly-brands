import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Searchbar } from "react-native-paper";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
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
          {
            borderRadius: 15,
            backgroundColor: Colors(theme).aliceBlue,
          },
        ]}
        iconColor={Colors(theme).gray100}
      />
      <Button
        mode="contained"
        onPress={() => {
          if (ToggleModal) ToggleModal(true);
        }}
        style={{
          borderRadius: 15,
          paddingTop: 6,
          paddingHorizontal: 4,
          paddingBottom: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesomeIcon
          color={Colors(theme).white}
          icon={faSliders}
          size={24}
        />
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
});

export default SearchComponent;
