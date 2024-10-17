import { Button } from "react-native-paper";
import { View } from "../theme/Themed";
import { useAuthContext } from "@/contexts";

const Menu = () => {
  const {
    signOutManager: signOut,
  } = useAuthContext();

  return (
    <View>
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
