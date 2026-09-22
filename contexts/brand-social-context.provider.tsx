import { Console } from "@/shared-libs/utils/console";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { collection, onSnapshot } from "firebase/firestore";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type PropsWithChildren,
} from "react";
import { useBrandContext } from "./brand-context.provider";

// ─── ISocialAccount mirrors the backend SocialAccount struct (social_v2.go) ──
export interface ISocialAccount {
    id: string;
    platform: "instagram" | "facebook" | "youtube" | "linkedin" | "linkedin_page" | "twitter" | "reddit";
    /** "organization" for a LinkedIn Company Page; absent/"member" for personal accounts. */
    accountType?: string;
    /** Platform's own account id (e.g. a LinkedIn org id) when distinct from `id`. */
    platformAccountId?: string;
    /** Human-readable handle/slug (e.g. a LinkedIn Page vanity name). */
    vanityName?: string;
    userId: string;
    username: string;
    displayName: string;
    profileImageURL: string;
    bio?: string;
    profileURL?: string;
    followerCount: number;
    followingCount: number;
    mediaCount: number;
    connectedAt: number;
    updatedAt: number;
    rawProfile?: Record<string, unknown>;
}

/**
 * Platforms whose `username` is an opaque id rather than a human-readable
 * handle, so the label must come from `displayName`:
 *  - Facebook stores the numeric Page id in `username`.
 *  - LinkedIn stores the OpenID `sub` member id (e.g. "Au3Lx1cikz") in `username`.
 */
const OPAQUE_USERNAME_PLATFORMS: ISocialAccount["platform"][] = [
    "facebook",
    "linkedin",
];

/**
 * Human label for a connected social account.
 *
 * For platforms in {@link OPAQUE_USERNAME_PLATFORMS} the `username` is a raw id,
 * so we surface `displayName` (the real name) — never the id. Instagram (and the
 * rest) keep the recognisable @handle in `username`, which is the most
 * identifiable label there.
 */
export function socialAccountLabel(
    account: Pick<ISocialAccount, "platform" | "username" | "displayName">
): string {
    if (OPAQUE_USERNAME_PLATFORMS.includes(account.platform)) {
        return account.displayName || account.username;
    }
    return account.username || account.displayName;
}

interface BrandSocialContextProps {
    socialAccounts: ISocialAccount[];
    isFetchingSocials: boolean;
    refreshSocials: () => void;
}

const BrandSocialContext = createContext<BrandSocialContextProps>({
    socialAccounts: [],
    isFetchingSocials: false,
    refreshSocials: () => { },
});

export const BrandSocialContextProvider = ({ children }: PropsWithChildren<{}>) => {
    const { selectedBrand } = useBrandContext();
    const [socialAccounts, setSocialAccounts] = useState<ISocialAccount[]>([]);
    const [isFetchingSocials, setIsFetchingSocials] = useState(false);
    const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

    const fetchSocials = (brandId: string) => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = undefined;
        }

        setIsFetchingSocials(true);

        try {
            const socialAccountsRef = collection(
                FirestoreDB,
                "brands",
                brandId,
                "socialAccounts"
            );

            const unsubscribe = onSnapshot(
                socialAccountsRef,
                (snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                        ...(doc.data() as ISocialAccount),
                        id: doc.id,
                    }));
                    setSocialAccounts(data);
                    setIsFetchingSocials(false);
                },
                (error) => {
                    Console.error(error, "Error in brand socialAccounts snapshot:");
                    setIsFetchingSocials(false);
                }
            );

            unsubscribeRef.current = unsubscribe;
            return unsubscribe;
        } catch (error) {
            Console.error(error, "Error setting up brand socialAccounts snapshot:");
            setIsFetchingSocials(false);
        }
    };

    const refreshSocials = () => {
        if (selectedBrand?.id) {
            fetchSocials(selectedBrand.id);
        }
    };

    useEffect(() => {
        if (!selectedBrand?.id) {
            setSocialAccounts([]);
            return;
        }

        const unsubscribe = fetchSocials(selectedBrand.id);
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedBrand?.id]);

    return (
        <BrandSocialContext.Provider
            value={{ socialAccounts, isFetchingSocials, refreshSocials }}
        >
            {children}
        </BrandSocialContext.Provider>
    );
};

export const useBrandSocialContext = () => useContext(BrandSocialContext);
