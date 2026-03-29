import Colors from '@/shared-uis/constants/Colors';
import { faChevronCircleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme as useAppTheme } from '@react-navigation/native';
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from 'stream-chat-expo';

export type MoreOptionsButtonProps = {
    /** Function that opens attachment options bottom sheet */
    handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

export const MoreOptionsButton = (props: MoreOptionsButtonProps) => {
    const { handleOnPress } = props;

    const {
        theme: {
            colors: { accent_blue },
            messageInput: { moreOptionsButton },
        },
    } = useTheme();
    const appTheme = useAppTheme();

    return (
        <TouchableOpacity
            hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
            onPress={handleOnPress}
            style={[moreOptionsButton]}
            testID='more-options-button'
        >
            <FontAwesomeIcon
                color={Colors(appTheme).primary}
                icon={faChevronCircleRight}
                size={22}
                style={{
                    marginTop: 4,
                }}
            />
        </TouchableOpacity>
    );
};

MoreOptionsButton.displayName = 'MoreOptionsButton{messageInput}';
