import { PersistentStorage } from "@/shared-libs/utils/persistent-storage";

export interface GuideTourStorageAdapter {
    get: (k: string) => Promise<string | null>;
    set: (k: string, v: string) => Promise<void>;
}

/**
 * Creates a storage adapter for the coachmark library that uses PersistentStorage
 * and prefixes keys with the manager ID for per-user tour completion.
 */
export function createGuideTourStorageAdapter(
    managerId: string | undefined
): GuideTourStorageAdapter {
    return {
        get: async (k: string) => {
            if (__DEV__) return null;
            const key = managerId ? `guide-tour-${managerId}-${k}` : k;
            return PersistentStorage.get(key);
        },
        set: async (k: string, v: string) => {
            if (__DEV__) return;
            const key = managerId ? `guide-tour-${managerId}-${k}` : k;
            await PersistentStorage.set(key, v);
        },
    };
}
