import { INITIAL_MANAGER_DATA } from "@/constants/Manager";
import { useAuthContext } from "@/contexts";
import { isWorkEmail } from "@/contexts/auth-context.provider";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import { GoogleAuthProvider, signInWithCredential, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
    GoogleSignin,
    isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useEffect } from "react";


export const useGoogleLogin = (setLoading: Function, setError: Function, signupHandler: Function | null = null) => {
    const { firebaseSignIn, firebaseSignUp } = useAuthContext();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "799278694891-mqote8c8hpb4952l2hg9hchkni8js2k5.apps.googleusercontent.com",
            offlineAccess: true
        })
    }, [])

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
        if (isExistingUser) {
            firebaseSignIn(result);
        } else {
            if (signupHandler)
                signupHandler(result)
            else
                firebaseSignUp(result);
        }
        Toaster.success('Logged in with Google successfully');
    }

    const googleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            if (GoogleSignin.hasPreviousSignIn()) {
                await GoogleSignin.signOut()
            }
            const signInResponse = await GoogleSignin.signIn()
            if (isSuccessResponse(signInResponse)) {
                setLoading(true);
                const idToken = signInResponse?.data?.idToken;
                if (!idToken)
                    throw new Error("Missing Google ID Token from sign-in response");

                const credential = GoogleAuthProvider.credential(idToken);
                const firebaseResult = await signInWithCredential(AuthApp, credential);
                await evalResult(firebaseResult);
            } else if (signInResponse.type === 'cancelled') {
                Toaster.error('Google sign-in cancelled or failed');
                Console.log("Google sign-in cancelled or failed", signInResponse);
                setError('cancelled');
            }
        } catch (error: any) {
            Console.log("Error logging in with Google:", error);
            Toaster.error('Error logging in with Google', error?.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    return {
        googleLogin
    }
}