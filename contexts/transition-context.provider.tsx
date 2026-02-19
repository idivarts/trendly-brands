import PageTransition, { PageTransitionRef } from '@/components/pre-signin/PageTransition';
import React, { createContext, useContext, useRef } from 'react';

interface TransitionContextType {
    triggerTransition: (
        layout: { x: number; y: number; width: number; height: number },
        colors: string[],
        onComplete: () => void
    ) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const transitionRef = useRef<PageTransitionRef>(null);

    const triggerTransition = (
        layout: { x: number; y: number; width: number; height: number },
        colors: string[],
        onComplete: () => void
    ) => {
        transitionRef.current?.triggerTransition(layout, colors, onComplete);
    };

    return (
        <TransitionContext.Provider value={{ triggerTransition }}>
            {children}
            <PageTransition ref={transitionRef} />
        </TransitionContext.Provider>
    );
};

export const useTransition = () => {
    const context = useContext(TransitionContext);
    if (!context) {
        throw new Error('useTransition must be used within TransitionProvider');
    }
    return context;
};
