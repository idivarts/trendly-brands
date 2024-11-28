import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useTheme } from "@react-navigation/native";
import { usePathname } from "expo-router";
import Colors from "@/constants/Colors";

interface DrawerIconProps {
  href?: string;
  icon: IconProp;
}

const DrawerIcon: React.FC<DrawerIconProps> = ({
  href,
  icon,
}) => {
  const theme = useTheme();
  const pathname = usePathname();

  return (
    <FontAwesomeIcon
      icon={icon}
      color={
        href?.includes(pathname)
          ? Colors(theme).white
          : Colors(theme).text
      }
      size={28}
    />
  );
};

export default DrawerIcon;
