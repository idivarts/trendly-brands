import { Image } from "react-native";
import { View } from "@/components/theme/Themed";

const Index = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image
        source={require("@/assets/images/splash.png")}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </View>
  );
};

export default Index;
