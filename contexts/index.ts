import { AWSContextProvider, useAWSContext } from "@/shared-libs/contexts/aws-context.provider";
import {
    BrandSocialContextProvider,
    useBrandSocialContext,
    type ISocialAccount,
} from "./brand-social-context.provider";
import {
    LocationContextProvider,
    useLocationContext,
} from "./location-context.provider";
import {
    CloudMessagingContextProvider,
    useCloudMessagingContext,
} from "../shared-libs/contexts/cloud-messaging.provider";
import { AuthContextProvider, useAuthContext } from "./auth-context.provider";
import { ChatContextProvider, useChatContext } from "./chat-context.provider";
import {
    CollaborationContextProvider,
    useCollaborationContext,
} from "./collaboration-context.provider";
import {
    ContractContextProvider,
    useContractContext,
} from "./contract-context.provider";
import {
    FirebaseStorageContextProvider,
    useFirebaseStorageContext,
} from "./firebase-storage-context.provider";
import {
    NicheProvider,
    useNiche,
} from "./niche-context.provider";
import {
    NotificationContextProvider,
    useNotificationContext,
} from "./notification-context.provider";
import {
    ThemeOverrideProvider,
    useThemeOverride,
} from "./theme-override-context.provider";
import {
    TransitionProvider,
    useTransition,
} from "./transition-context.provider";

export {
    AuthContextProvider,
    AWSContextProvider,
    BrandSocialContextProvider,
    useBrandSocialContext,
    type ISocialAccount,
    LocationContextProvider,
    ChatContextProvider,
    CloudMessagingContextProvider,
    CollaborationContextProvider,
    ContractContextProvider,
    FirebaseStorageContextProvider,
    NicheProvider,
    NotificationContextProvider,
    ThemeOverrideProvider,
    TransitionProvider,
    useAuthContext,
    useAWSContext,
    useChatContext,
    useCloudMessagingContext,
    useCollaborationContext,
    useContractContext,
    useFirebaseStorageContext,
    useNiche,
    useNotificationContext,
    useThemeOverride,
    useTransition,
    useLocationContext,
};
