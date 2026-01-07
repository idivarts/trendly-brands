import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
    initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
    return React.useReducer(
        (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
        initialValue
    ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null) {
    if (Platform.OS === 'web') {
        try {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            Console.error(e, 'Local storage is unavailable');
        }
    } else {
        if (value == null) {
            await SecureStore.deleteItemAsync(key);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    }
}

export function useStorageState(key: string): UseStateHook<string> {
    // Public
    const [state, setState] = useAsyncState<string>();

    // Get
    React.useEffect(() => {
        (async () => {
            // await AuthApp.signOut()
            await AuthApp.authStateReady();
            if (key != "manager" || AuthApp.currentUser) {
                if (Platform.OS === 'web') {
                    try {
                        if (typeof localStorage !== 'undefined') {
                            setState(localStorage.getItem(key));
                        }
                    } catch (e) {
                        Console.error(e, 'Local storage is unavailable');
                    }
                } else {
                    SecureStore.getItemAsync(key).then(value => {
                        setState(value);
                    });
                }
            } else {
                setState(null);
            }
        })();
    }, [key]);

    // Set
    const setValue = React.useCallback(
        (value: string | null) => {
            setState(value);
            setStorageItemAsync(key, value);
        },
        [key]
    );

    return [state, setValue];
}
