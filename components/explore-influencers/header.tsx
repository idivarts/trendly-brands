import { useTheme } from "@react-navigation/native";
import { Text, View } from "../theme/Themed";
import Colors from "@/constants/Colors";
import { Pressable } from "react-native";
import { useBreakpoints } from "@/hooks";
import BrandSwitcher from "../ui/brand-switcher";
import DrawerToggleButton from "../ui/drawer-toggle-button/DrawerToggleButton";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useBrandContext } from "@/contexts/brand-context.provider";

const Header: React.FC = (props) => {
  const theme = useTheme();
  const { xl } = useBreakpoints();

  const {
    selectedBrand,
  } = useBrandContext();

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: Colors(theme).text,
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        {selectedBrand?.name ?? "Brand"}
      </Text>
      <Pressable>
        {
          xl ? (
            <BrandSwitcher />
          ) : (
            <DrawerToggleButton
              icon={
                <FontAwesomeIcon
                  color={Colors(theme).text}
                  icon={faChevronDown}
                  size={24}
                  style={{
                    marginLeft: 10,
                    color: Colors(theme).text,
                    marginBottom: -2,
                  }}
                />
              }
            />
          )
        }
      </Pressable>
    </View>
  );
};

export default Header;
