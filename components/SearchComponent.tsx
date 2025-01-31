import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Searchbar } from "react-native-paper";
import Colors from "@/constants/Colors";
import { useTheme } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faFilter, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import searchComponentStylesFn from "@/styles/searchbar/SearchComponent.styles";

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
  const searchComponentStyles = searchComponentStylesFn(theme);

  const handleChangeText = (query: string) => {
    setLocalQuery(query);
    setSearchQuery(query);
  };

  const handleClearText = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <View style={[searchComponentStyles.searchContainer]}>
      <Searchbar
        icon={() => (
          <FontAwesomeIcon
            color={Colors(theme).gray100}
            icon={faMagnifyingGlass}
            size={18}
          />
        )}
        iconColor={Colors(theme).gray100}
        inputStyle={styles.searchbarInput}
        onChangeText={handleChangeText}
        placeholder="Search"
        placeholderTextColor={Colors(theme).gray100}
        style={styles.searchbar}
        value={localQuery}
      />
      {/* <Pressable
        onPress={() => {
          if (ToggleModal) ToggleModal(true);
        }}
      >
        <FontAwesomeIcon
          color={Colors(theme).primary}
          icon={faFilter}
          size={28}
        />
      </Pressable> */}
    </View>
  );
};

export default SearchComponent;
