import Colors from "@/shared-uis/constants/Colors";
import { Theme } from "@react-navigation/native";
import { DeepPartial, defaultTheme, Theme as StreamTheme } from "stream-chat-expo";

const useStreamThemeNative = (
    theme: Theme,
) => {
    const getTheme = (): DeepPartial<StreamTheme> => ({
        colors: theme.dark ? {
            black: '#FFFFFF',
            white: '#000000',
            white_smoke: '#000000',
            white_snow: '#000000',
            static_white: '#000000',
            icon_background: '#000000',
            label_bg_transparent: '#FFFFFF33',
            targetedMessageBackground: '#302D22',
            static_black: '#FFFFFF',
        } : defaultTheme.colors,
        messageSimple: {
            content: theme.dark ? {
                textContainer: {
                    backgroundColor: Colors(theme).transparent,
                },
                container: {
                    backgroundColor: Colors(theme).background,
                },
                containerInner: {
                    backgroundColor: Colors(theme).background,
                },
                markdown: {
                    text: {
                        color: Colors(theme).text,
                    }
                }
            } : {
                ...defaultTheme.messageSimple.content,
            },
        },
    });

    return {
        getTheme,
    };
};

export default useStreamThemeNative;
