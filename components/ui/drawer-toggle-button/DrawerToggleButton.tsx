import { useTheme } from '@react-navigation/native';
import { Pressable } from 'react-native';

import { View } from '@/components/theme/Themed';
import Colors from '@/constants/Colors';
import { OpenDrawerSubject } from '@/shared-uis/components/CustomDrawer';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

interface DrawerToggleButtonProps extends React.ComponentProps<typeof Pressable> {
    icon?: React.ReactNode;
}

const DrawerToggleButton: React.FC<DrawerToggleButtonProps> = ({
    icon,
    ...props
}) => {
    const theme = useTheme();
    return (
        <Pressable
            {...props}
            onPress={() => OpenDrawerSubject.next(true)}
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
