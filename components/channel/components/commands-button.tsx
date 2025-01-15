import Colors from '@/constants/Colors';
import { faBolt, faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable } from 'react-native';
import { DefaultStreamChatGenerics, isSuggestionCommand, SuggestionsContextValue, useSuggestionsContext, useTheme } from 'stream-chat-expo';
import {
  useTheme as useAppTheme,
} from '@react-navigation/native';

type CommandsButtonPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<SuggestionsContextValue<StreamChatGenerics>, 'suggestions'> & {
  /** Function that opens commands selector */
  handleOnPress?: ((event: GestureResponderEvent) => void) & (() => void);
};

const CommandsButtonWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { handleOnPress, suggestions } = props;

  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: { commandsButton },
    },
  } = useTheme();
  const appTheme = useAppTheme();

  return (
    <Pressable onPress={handleOnPress} style={[commandsButton]} testID='commands-button'>
      <FontAwesomeIcon
        color={suggestions && suggestions.data.some((suggestion) => isSuggestionCommand(suggestion))
          ? Colors(appTheme).primary
          : Colors(appTheme).primary}
        icon={faBolt}
        size={22}
        style={{
          marginTop: 4,
        }}
      />
    </Pressable>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
  nextProps: CommandsButtonPropsWithContext<StreamChatGenerics>,
) => {
  const { suggestions: prevSuggestions } = prevProps;
  const { suggestions: nextSuggestions } = nextProps;

  const suggestionsEqual = !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) return false;

  return true;
};

const MemoizedCommandsButton = React.memo(
  CommandsButtonWithContext,
  areEqual,
) as typeof CommandsButtonWithContext;

export type CommandsButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<CommandsButtonPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for attach button in MessageInput component.
 */
export const CommandsButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: CommandsButtonProps<StreamChatGenerics>,
) => {
  const { suggestions } = useSuggestionsContext<StreamChatGenerics>();

  return <MemoizedCommandsButton {...{ suggestions }} {...props} />;
};

CommandsButton.displayName = 'CommandsButton{messageInput}';
