/**
 * MOCK ONLY — delete this file when removing the mock layer.
 *
 * Holds the currently-selected demo scenario. The dev state-switcher writes
 * to it; the mock inbox hook reads from it. This lives in a React context so
 * the production data hook (`data/use-inbox`) needs no scenario argument —
 * its signature stays clean for the real backend.
 */
import React, { createContext, useContext, useMemo, useState } from "react";

import {
    DEFAULT_INBOX_SCENARIO,
    InboxScenario,
} from "./scenario";

interface MockScenarioContextValue {
    scenario: InboxScenario;
    setScenario: (s: InboxScenario) => void;
}

const MockScenarioContext = createContext<MockScenarioContextValue>({
    scenario: DEFAULT_INBOX_SCENARIO,
    setScenario: () => {},
});

export const MockScenarioProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [scenario, setScenario] = useState<InboxScenario>(
        DEFAULT_INBOX_SCENARIO
    );
    const value = useMemo(() => ({ scenario, setScenario }), [scenario]);
    return (
        <MockScenarioContext.Provider value={value}>
            {children}
        </MockScenarioContext.Provider>
    );
};

export const useMockScenario = () => useContext(MockScenarioContext);
