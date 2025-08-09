import { INITIAL_MANAGER_DATA } from "@/constants/Manager";
import { useAuthContext } from "@/contexts";
import { isWorkEmail } from "@/contexts/auth-context.provider";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
// provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// provider.setCustomParameters({
//     'login_hint': 'user@example.com'
// });

export const useGoogleLogin = (setLoading: Function, setError: Function, signupHandler: Function | null = null) => {
    const { firebaseSignIn, firebaseSignUp } = useAuthContext();

    const evalResult = async (result: void | UserCredential) => {
        if (!result)
            return;
        if (!result.user.email) {
            throw "We cant find your email"
        }
        if (!isWorkEmail(result.user.email)) {
            setError("You can only proceed with your work email")
            throw "You can only proceed with your work email";
        }

        setLoading(true)
        const managerRef = await doc(FirestoreDB, "managers", result.user.uid);
        const findUser = await getDoc(managerRef);
        const isExistingUser = findUser.exists();

        if (!isExistingUser) {
            const userData: IManagers = {
                ...INITIAL_MANAGER_DATA,
                name: result.user.displayName || "",
                email: result.user.email || "",
                creationTime: Date.now()
            };
            await setDoc(managerRef, userData);
        }
        // userRef.
        if (signupHandler)
            signupHandler(result)
        else if (isExistingUser) {
            firebaseSignIn(result);
        } else {
            firebaseSignUp(result);
        }
        Toaster.success('Logged in with Google successfully');
    }

    const googleLogin = () => {
        try {
            signInWithPopup(AuthApp, provider).catch((error) => {
                Toaster.error('Error logging in with Google', error.message);
                Console.log(error);
            }).then(async (result) => {
                await evalResult(result);
            }).catch(e => {
                Console.log("Error", e);
                Toaster.error('Error logging in with Google');
                setLoading(false);
            })
        } catch (e) {
            Console.log("Error", e);
        } finally {
            setLoading(false);
        }
    }

    return {
        googleLogin
    }
}