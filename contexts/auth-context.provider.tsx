import { useStorageState } from "@/hooks";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { FirestoreDB } from "@/utils/firestore";
import { Manager } from "@/types/Manager";
import { AuthApp } from "@/utils/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { analyticsLogEvent } from "@/utils/analytics";

interface AuthContextProps {
  firebaseSignIn: (token: string) => void;
  firebaseSignUp: (token: string) => void;
  getManager: (managerId: string) => Promise<Manager | null>;
  isLoading: boolean;
  session?: string | null;
  signIn: (email: string, password: string) => void;
  signOutManager: () => void;
  signUp: (name: string, email: string, password: string) => void;
  updateManager: (managerId: string, manager: Partial<Manager>) => Promise<void>;
  manager: Manager | null;
}

const AuthContext = createContext<AuthContextProps>({
  firebaseSignIn: (token: string) => null,
  firebaseSignUp: (token: string) => null,
  getManager: () => Promise.resolve(null),
  isLoading: false,
  session: null,
  signIn: (email: string, password: string) => null,
  signOutManager: () => null,
  signUp: (name: string, email: string, password: string) => null,
  updateManager: () => Promise.resolve(),
  manager: null,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [[isLoading, session], setSession] = useStorageState("id");
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
      setSession(managerCredential.user.uid);

      await analyticsLogEvent('signed_in', {
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
    try {
      const managerCredential = await createUserWithEmailAndPassword(
        AuthApp,
        email,
        password
      );

      await setDoc(doc(FirestoreDB, "managers", managerCredential.user.uid), {
        name,
        email,
        location: "",
        phoneNumber: "",
        preferences: {
          question1: "",
          question2: "",
          question3: "",
        },
        profileImage: "",
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          theme: "light",
        },
      });

      setSession(managerCredential.user.uid);

      // For non-existing managers, redirect to the onboarding screen.
      router.replace("/questions");
      Toaster.success("Signed Up Successfully!");
    } catch (error) {
      console.error("Error signing up: ", error);
      Toaster.error("Error signing up. Please try again.");
    }
  };

  const firebaseSignIn = async (token: string) => {
    setSession(token);

    router.replace("/explore-influencers");
    Toaster.success("Signed In Successfully!");
  };

  const firebaseSignUp = async (token: string) => {
    setSession(token);
    router.replace("/questions");
    Toaster.success("Signed Up Successfully!");
  };

  const signOutManager = () => {
    signOut(AuthApp)
      .then(() => {
        setSession("");

        analyticsLogEvent('signed_out', {
          id: manager?.id,
          email: manager?.email,
        });

        router.replace("/pre-signin");
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
        firebaseSignIn,
        firebaseSignUp,
        getManager,
        isLoading,
        session,
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
