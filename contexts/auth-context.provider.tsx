import { useStorageState } from "@/hooks";
import { analyticsLogEvent } from "@/shared-libs/utils/firebase/analytics";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import { HttpWrapper } from "@/shared-libs/utils/http-wrapper";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { Manager } from "@/types/Manager";
import { User } from "@/types/User";
import { updatedTokens } from "@/utils/push-notification/push-notification-token.native";
import { resetAndNavigate } from "@/utils/router";
import { checkTestUsers } from "@/utils/test-users";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";

interface AuthContextProps {
  getManager: (managerId: string) => Promise<Manager | null>;
  getInfluencerById: (influencerId: string) => Promise<User | null>;
  isLoading: boolean;
  session?: string | null;
  setSession: (value: string | null) => void;
  signIn: (email: string, password: string) => void;
  signOutManager: () => void;
  signUp: (name: string, email: string, password: string) => void;
  updateManager: (
    managerId: string,
    manager: Partial<Manager>
  ) => Promise<void>;
  manager: Manager | null;
}

const AuthContext = createContext<AuthContextProps>({
  getManager: () => Promise.resolve(null),
  getInfluencerById: () => Promise.resolve(null),
  isLoading: false,
  setSession: () => null,
  session: null,
  signIn: (email: string, password: string) => null,
  signOutManager: () => null,
  signUp: (name: string, email: string, password: string) => null,
  updateManager: () => Promise.resolve(),
  manager: null,
});

export const useAuthContext = () => useContext(AuthContext);

const isWorkEmail = (email: string): boolean => {
  const generalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com"];
  const emailDomain = email.split("@")[1]?.toLowerCase();
  return emailDomain ? !generalDomains.includes(emailDomain) : false;
};

export const AuthContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [[isLoading, session], setSession] = useStorageState("manager");
  const [manager, setManager] = useState<Manager | null>(null);
  const router = useRouter();

  const fetchManager = async () => {
    if (session) {
      const managerDocRef = doc(FirestoreDB, "managers", session);

      const unsubscribe = onSnapshot(managerDocRef, (managerSnap) => {
        if (managerSnap.exists()) {
          const managerData = {
            ...(managerSnap.data() as Manager),
            id: managerSnap.id as string,
          };
          setManager(managerData);
        } else {
          console.error("Manager not found");
        }
      });

      return unsubscribe;
    }
  };

  useEffect(() => {
    fetchManager();
  }, [session]);

  const signIn = async (email: string, password: string) => {
    try {
      const managerCredential = await signInWithEmailAndPassword(
        AuthApp,
        email,
        password
      );

      if (!email || !password) {
        Toaster.error("Please enter your email and password.");
        return;
      }

      const testUsers = checkTestUsers(email);

      if (!testUsers && !managerCredential.user.emailVerified) {
        Toaster.error("Please verify your email first.");
        sendEmailVerification(managerCredential.user);
        return;
      }

      setSession(managerCredential.user.uid);

      await HttpWrapper.fetch("/api/v1/chat/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await analyticsLogEvent("signed_in", {
        id: managerCredential.user.uid,
        name: managerCredential.user.displayName,
        email: managerCredential.user.email,
      });

      // For existing managers, redirect to the main screen.
      router.replace("/explore-influencers");
      Toaster.success("Signed In Successfully!");
    } catch (error) {
      console.error("Error signing in: ", error);
      Toaster.error("Error signing in. Please try again.");
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    if (!name || !email || !password) {
      Toaster.error("Please fill in all fields.");
      return;
    }
    if (!isWorkEmail(email)) {
      Toaster.error("Please enter a work email to proceed.");
      return;
    }

    await createUserWithEmailAndPassword(AuthApp, email, password)
      .then(async (userCredential) => {
        const colRef = collection(FirestoreDB, "managers");
        const docRef = doc(colRef, userCredential.user.uid);

        let userData = {
          name: name,
          email: email,
          pushNotificationToken: {
            ios: [],
            android: [],
            web: [],
          },
          settings: {
            theme: "light",
            emailNotification: true,
            pushNotification: true,
          },
        };

        await setDoc(docRef, userData);

        await sendEmailVerification(userCredential.user).then(() => {
          Toaster.success("Verification email sent successfully.");
        });

        const checkVerification = async () => {
          await userCredential.user.reload();
          if (userCredential.user.emailVerified) {
            setSession(userCredential.user.uid);

            resetAndNavigate({
              pathname: "/onboarding-your-brand",
              params: {
                firstBrand: "true",
              },
            });

            await HttpWrapper.fetch("/api/v1/chat/auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
          } else {
            setTimeout(checkVerification, 2000);
          }
        };

        checkVerification();
      })
      .catch((error) => {
        let errorMessage = "An unknown error occurred. Please try again.";
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "The email address is already in use.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak.";
            break;
          default:
            errorMessage = error.message;
        }
        Toaster.error(errorMessage);
      });
  };

  const signOutManager = async () => {
    if (Platform.OS !== "web") {
      // Remove push notification token from the database
      const newUpdatedTokens = await updatedTokens(manager);

      if (newUpdatedTokens) {
        await updateManager(session as string, {
          pushNotificationToken: newUpdatedTokens,
        });
      }
    }

    signOut(AuthApp)
      .then(() => {
        setSession("");
        setManager(null);

        analyticsLogEvent("signed_out", {
          id: manager?.id,
          email: manager?.email,
        });

        resetAndNavigate("/pre-signin");
        Toaster.success("Signed Out Successfully!");
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  };

  const getManager = async (managerId: string): Promise<Manager | null> => {
    const managerRef = doc(FirestoreDB, "managers", managerId);
    const managerSnap = await getDoc(managerRef);

    if (managerSnap.exists()) {
      const managerData = {
        ...(managerSnap.data() as Manager),
        id: managerSnap.id as string,
      };
      setManager(managerData);
      return managerData;
    }

    return null;
  };

  const getInfluencerById = async (
    influencerId: string
  ): Promise<User | null> => {
    const userRef = doc(FirestoreDB, "users", influencerId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = {
        ...(userSnap.data() as User),
        id: userSnap.id as string,
      };
      return userData;
    }

    return null;
  };

  const updateManager = async (
    managerId: string,
    manager: Partial<Manager>
  ): Promise<void> => {
    const managerRef = doc(FirestoreDB, "managers", managerId);

    await updateDoc(managerRef, {
      ...manager,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        getManager,
        getInfluencerById,
        isLoading,
        session,
        setSession,
        signIn,
        signOutManager,
        signUp,
        updateManager,
        manager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
