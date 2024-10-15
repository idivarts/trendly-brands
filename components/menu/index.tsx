import { Button, Text } from "react-native-paper";
import { View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";

const Menu = () => {
  const {
    signOutManager: signOut,
  } = useAuthContext();

  return (
    <View>
      <Text>Menu</Text>
      <Button
        onPress={() => {
          signOut();
        }}
      >
        Logout
      </Button>
    </View>
  );
};

export default Menu;
