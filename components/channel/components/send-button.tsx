import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';

import Colors from '@/shared-uis/constants/Colors';
import {
    useTheme as useAppTheme,
} from '@react-navigation/native';
import { Pressable } from 'react-native';
import { DefaultStreamChatGenerics, MessageInputContextValue, Search, useMessageInputContext, useTheme } from 'stream-chat-expo';

type SendButtonPropsWithContext<
    StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageInputContextValue<StreamChatGenerics>, 'giphyActive' | 'sendMessage'> & {
  /** Disables the button */ disabled: boolean;
};

const SendButtonWithContext = <
    StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
    props: SendButtonPropsWithContext<StreamChatGenerics>,
) => {
    const { disabled = false, giphyActive, sendMessage } = props;
    const {
        theme: {
            colors: { accent_blue, grey_gainsboro },
            messageInput: { searchIcon, sendButton, sendRightIcon, sendUpIcon },
        },
    } = useTheme();

    const appTheme = useAppTheme();

    return (
        <Pressable
            disabled={disabled}
            onPress={disabled ? () => null : () => sendMessage()}
            style={[sendButton]}
            testID='send-button'
        >
            {giphyActive ? (
                <Search
                    pathFill={disabled ? grey_gainsboro : accent_blue}
                    {...searchIcon}
                />
            ) : disabled ? (
                // <SendRight
                //   fill={grey_gainsboro}
                //   size={32}
                //   {...sendRightIcon}
                // />
                <FontAwesomeIcon
                    color={Colors(appTheme).primary}
                    icon={faPaperPlane}
                    size={22}
                />
            ) : (
                // <SendUp
                //   fill={accent_blue}
                //   size={32}
                //   {...sendUpIcon}
                // />
                <FontAwesomeIcon
                    color={Colors(appTheme).primary}
                    icon={faPaperPlane}
                    size={22}
                />
            )}
        </Pressable>
    );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
    prevProps: SendButtonPropsWithContext<StreamChatGenerics>,
    nextProps: SendButtonPropsWithContext<StreamChatGenerics>,
) => {
    const {
        disabled: prevDisabled,
        giphyActive: prevGiphyActive,
        sendMessage: prevSendMessage,
    } = prevProps;
    const {
        disabled: nextDisabled,
        giphyActive: nextGiphyActive,
        sendMessage: nextSendMessage,
    } = nextProps;

    const disabledEqual = prevDisabled === nextDisabled;
    if (!disabledEqual) return false;

    const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
    if (!giphyActiveEqual) return false;

    const sendMessageEqual = prevSendMessage === nextSendMessage;
    if (!sendMessageEqual) return false;

    return true;
};

const MemoizedSendButton = React.memo(
    SendButtonWithContext,
    areEqual,
) as typeof SendButtonWithContext;

export type SendButtonProps<
    StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<SendButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for send button in MessageInput component.
 */
export const SendButton = <
    StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
    props: SendButtonProps<StreamChatGenerics>,
) => {
    const { giphyActive, sendMessage } = useMessageInputContext<StreamChatGenerics>();

    return (
        <MemoizedSendButton
            {...{ giphyActive, sendMessage }}
            {...props}
            {...{ disabled: props.disabled || false }}
        />
    );
};

SendButton.displayName = 'SendButton{messageInput}';
