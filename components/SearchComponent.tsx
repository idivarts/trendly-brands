import Colors from "@/shared-uis/constants/Colors";
import stylesFn from "@/styles/searchbar/Searchbar.styles";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Searchbar } from "react-native-paper";

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
    const styles = useMemo(() => stylesFn(theme), [theme]);
    const searchComponentStyles = useMemo(() => useSearchComponentStyles(), []);

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

function useSearchComponentStyles() {
    return StyleSheet.create({
        searchContainer: {
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            width: "100%",
        },
    });
}

export default SearchComponent;
