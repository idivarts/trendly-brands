

import { AuthApp } from '@/shared-libs/utils/firebase/auth';
import { signInAnonymously } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface PublicContextType {
    isLoading: boolean
    session?: string
}

const PublicContext = createContext<PublicContextType>({
    isLoading: true
} as PublicContextType);

interface PublicContextProviderProps {
    children: ReactNode;
}

export const PublicContextProvider = ({ children }: PublicContextProviderProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [annonymousSession, setAnnonymousSession] = useState("")

    const initiate = async () => {
        setIsLoading(true)
        try {
            await AuthApp.authStateReady()
            if (!AuthApp.currentUser) {
                let userCredentials = await signInAnonymously(AuthApp)
                setAnnonymousSession(userCredentials.user.uid)
            } else {
                setAnnonymousSession(AuthApp.currentUser.uid)
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        initiate()
    }, [])

    const value: PublicContextType = {
        isLoading,
        session: annonymousSession
    };

    return (
        <PublicContext.Provider value={value}>
            {children}
        </PublicContext.Provider>
    );
};

export const usePublicContext = () => useContext(PublicContext);