import { Pressable } from 'react-native';
import { DrawerActions, useTheme } from '@react-navigation/native';
import { useNavigation } from "expo-router";

import Colors from '@/constants/Colors';
import { View } from '@/components/theme/Themed';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

interface DrawerToggleButtonProps extends React.ComponentProps<typeof Pressable> {
  icon?: React.ReactNode;
}

const DrawerToggleButton: React.FC<DrawerToggleButtonProps> = ({
  icon,
  ...props
}) => {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {
          icon ?? (
            <FontAwesomeIcon
              color={Colors(theme).text}
              icon={faBars}
              size={24}
              style={{
                marginLeft: 14,
                marginBottom: -2,
              }}
            />
          )
        }
      </View>
    </Pressable>
  )
};

export default DrawerToggleButton;
