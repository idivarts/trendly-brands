import { INITIAL_MANAGER_DATA } from "@/constants/Manager";
import { useAuthContext } from "@/contexts";
import { IManagers } from "@/shared-libs/firestore/trendly-pro/models/managers";
import { Console } from "@/shared-libs/utils/console";
import { AuthApp } from "@/shared-libs/utils/firebase/auth";
import { FirestoreDB } from "@/shared-libs/utils/firebase/firestore";
import Toaster from "@/shared-uis/components/toaster/Toaster";
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential, UserCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const provider = new OAuthProvider('apple.com');
provider.addScope('email');
provider.addScope('name');

export const useAppleLogin = (setLoading: Function, setError: Function) => {
    const { firebaseSignIn, firebaseSignUp, signOutManager } = useAuthContext();
    const [isAppleAvailable, setIsAppleAvailable] = useState(false)
    useEffect(() => {
        (async () => {
            const b = await AppleAuthentication.isAvailableAsync()
            setIsAppleAvailable(b)
        })()
    }, [])

    const extractNameFromEmail = (email: string): string => {
        if (!email) return "Apple User";

        const namePart = email.split('@')[0];

        // Split on common delimiters like '.', '_', or '-' and filter empty values
        const parts = namePart.split(/[\.\_\-]/).filter(Boolean);

        // Capitalize each word
        const capitalized = parts.map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );

        return capitalized.join(' ');
    };
    const evalResult = async (result: void | UserCredential, appleCredential: AppleAuthentication.AppleAuthenticationCredential) => {
        if (!result) throw new Error("No result returned from signInWithCredential");
        if (!result.user) throw new Error("No user found in the result");
        if (!result.user.uid) throw new Error("No user ID found in the user object");
        if (!result.user.email) throw new Error("No email found in the user object");
        if (!appleCredential) throw new Error("No Apple credential returned");

        setLoading(true);
        const managerRef = await doc(FirestoreDB, "managers", result.user.uid);
        const findUser = await getDoc(managerRef);
        const isExistingUser = findUser.exists();

        if (!isExistingUser) {
            const userData: IManagers = {
                ...INITIAL_MANAGER_DATA,
                name: appleCredential.fullName?.givenName || extractNameFromEmail(result.user.email || ""),
                email: result.user.email || "",
                profileImage: "",
            };
            await setDoc(managerRef, userData);
        }

        Console.log("User logged in", isExistingUser, result.user)
        if (isExistingUser) {
            firebaseSignIn(result);
        } else {
            firebaseSignUp(result);
        }

        Toaster.success('Logged in with Apple successfully');
    };

    const appleLogin = async () => {
        try {
            const appleCredential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            Console.log("Apple credential:", appleCredential);
            const { identityToken } = appleCredential;
            if (!identityToken) throw new Error("No identity token returned");

            setLoading(true);
            const credential = provider.credential({
                idToken: identityToken,
            });

            const result = await signInWithCredential(AuthApp, credential).catch((error) => {
                Console.log(error, "signInWithCredential Error");
                throw new Error("Failed to sign in with Apple -" + error.message);
            })
            await evalResult(result, appleCredential);
        } catch (error: any) {
            Console.error(error, "Apple Signin Error");
            if (AuthApp.currentUser)
                Toaster.error('Error with User - ' + AuthApp.currentUser.uid, error?.message || '');
            else
                Toaster.error('Error logging in with Apple', error?.message || '');
            setError(error.message);
            signOutManager().catch(e => { Console.log(e, "Error Logging out") }) // For whatever reason if not successful signup - Logout
        } finally {
            setLoading(false);
        }
    };

    return {
        appleLogin,
        isAppleAvailable
    };
};