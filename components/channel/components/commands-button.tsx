import Colors from '@/constants/Colors';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    useTheme as useAppTheme,
} from '@react-navigation/native';
import React from 'react';
import type { GestureResponderEvent, PressableProps } from 'react-native';
import { Pressable } from 'react-native';
import { useMessageComposer, useTheme } from 'stream-chat-expo';

type CommandsButtonPropsWithContext = {
    /** Function that opens commands selector */
    handleOnPress?: PressableProps['onPress'];
};

const CommandsButtonWithContext = (props: CommandsButtonPropsWithContext) => {
    const { handleOnPress } = props;
    const { textComposer } = useMessageComposer();

    const {
        theme: {
            colors: { accent_blue, grey },
            messageInput: { commandsButton },
        },
    } = useTheme();
    const appTheme = useAppTheme();
    const onPressHandler = React.useCallback(
        async (event: GestureResponderEvent) => {
            if (handleOnPress) {
                handleOnPress(event);
                return;
            }

            await textComposer.handleChange({
                selection: {
                    end: 1,
                    start: 1,
                },
                text: '/',
            });
        },
        [handleOnPress, textComposer],
    );

    return (
        <Pressable onPress={onPressHandler} style={[commandsButton]} testID='commands-button'>
            <FontAwesomeIcon
                color={Colors(appTheme).primary}
                icon={faBolt}
                size={22}
                style={{
                    marginTop: 4,
                }}
            />
        </Pressable>
    );
};

const areEqual = (
    prevProps: CommandsButtonPropsWithContext,
    nextProps: CommandsButtonPropsWithContext,
) => {
    return prevProps.handleOnPress === nextProps.handleOnPress;
};

const MemoizedCommandsButton = React.memo(
    CommandsButtonWithContext,
    areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps = Partial<CommandsButtonPropsWithContext>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = (props: CommandsButtonProps) => {
    return <MemoizedCommandsButton {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
